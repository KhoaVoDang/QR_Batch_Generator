import './style.css'
import * as XLSX from 'xlsx';
import QRCode from 'qrcode';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import interact from 'interactjs';

// State
const state = {
  excelData: [],
  headers: [],
  selectedQrColumn: null,
  selectedTextColumn: null,
  bgImage: null, // Image Object
  bgImageSrc: null, // Data URL
  bgDimensions: { width: 0, height: 0 },
  qrPosition: { x: 0, y: 0 },
  textPosition: { x: 0, y: 0 },
  qrSize: 150,
  textSize: 16,
  qrColor: '#000000',
  textColor: '#000000'
};

// DOM Elements
const excelUpload = document.getElementById('excelUpload');
const excelFileName = document.getElementById('excelFileName');
const bgUpload = document.getElementById('bgUpload');
const bgFileName = document.getElementById('bgFileName');
const qrColumnSelect = document.getElementById('qrColumnSelect');
const textColumnSelect = document.getElementById('textColumnSelect');
const columnControls = document.getElementById('columnControls');
const canvasContainer = document.getElementById('canvasContainer');
const previewBg = document.getElementById('previewBg');
const qrElement = document.getElementById('qrElement');
const textElement = document.getElementById('textElement');
const qrPlaceholder = document.getElementById('qrPlaceholder');
const textPlaceholder = document.getElementById('textPlaceholder');
const generateBtn = document.getElementById('generateBtn');
const emptyState = document.getElementById('emptyState');

// Settings Inputs
const qrSizeInput = document.getElementById('qrSizeInput');
const qrColorInput = document.getElementById('qrColorInput');
const textSizeInput = document.getElementById('textSizeInput');
const textColorInput = document.getElementById('textColorInput');

// --- Initialization ---

function init() {
  setupEventListeners();
  setupDraggable();
}

// --- Event Listeners ---

function setupEventListeners() {
  excelUpload.addEventListener('change', handleExcelUpload);
  bgUpload.addEventListener('change', handleBgUpload);
  
  qrColumnSelect.addEventListener('change', (e) => {
    state.selectedQrColumn = e.target.value;
    updatePreview();
    checkGenerateButton();
  });

  textColumnSelect.addEventListener('change', (e) => {
    state.selectedTextColumn = e.target.value === 'none' ? null : e.target.value;
    updatePreview();
  });

  qrSizeInput.addEventListener('input', (e) => {
    state.qrSize = parseInt(e.target.value);
    updatePreview();
  });

  qrColorInput.addEventListener('input', (e) => {
    state.qrColor = e.target.value;
    updatePreview();
  });

  textSizeInput.addEventListener('input', (e) => {
    state.textSize = parseInt(e.target.value);
    updatePreview();
  });

  textColorInput.addEventListener('input', (e) => {
    state.textColor = e.target.value;
    updatePreview();
  });

  generateBtn.addEventListener('click', handleBatchGenerate);
}

// --- File Handling ---

function handleExcelUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  excelFileName.textContent = file.name;

  const reader = new FileReader();
  reader.onload = (e) => {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    if (json.length > 0) {
      state.headers = json[0];
      state.excelData = XLSX.utils.sheet_to_json(sheet); // Parse properly with headers
      populateColumnSelects();
      columnControls.classList.remove('disabled');
      updatePreview(); // Try to update if BG is already there
    }
  };
  reader.readAsArrayBuffer(file);
}

function handleBgUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  bgFileName.textContent = file.name;

  const reader = new FileReader();
  reader.onload = (e) => {
    state.bgImageSrc = e.target.result;
    previewBg.src = state.bgImageSrc;
    previewBg.style.display = 'block';
    
    // reset positions slightly inward
    state.qrPosition = { x: 50, y: 50 };
    state.textPosition = { x: 50, y: 250 };
    updateElementPosition(qrElement, state.qrPosition);
    updateElementPosition(textElement, state.textPosition);

    previewBg.onload = () => {
        state.bgDimensions = {
            width: previewBg.naturalWidth,
            height: previewBg.naturalHeight
        };
        // Show draggable elements
        qrElement.style.display = 'block';
        textElement.style.display = 'block';
        emptyState.style.display = 'none';
        
        // Adjust container size if needed? relying on max-width/height css
        updatePreview();
    }
  };
  reader.readAsDataURL(file);
}

function populateColumnSelects() {
  qrColumnSelect.innerHTML = '<option value="" disabled selected>Select Column</option>';
  textColumnSelect.innerHTML = '<option value="" disabled selected>Select Column</option><option value="none">-- None --</option>';

  state.headers.forEach(header => {
    const option1 = document.createElement('option');
    option1.value = header;
    option1.textContent = header;
    qrColumnSelect.appendChild(option1);

    const option2 = document.createElement('option');
    option2.value = header;
    option2.textContent = header;
    textColumnSelect.appendChild(option2);
  });
}

// --- Drag & Drop ---

function setupDraggable() {
  interact('.draggable')
    .draggable({
      modifiers: [
        interact.modifiers.restrictRect({
          restriction: 'parent',
          endOnly: true
        })
      ],
      autoScroll: true,
      listeners: {
        move: dragMoveListener,
      }
    });
}

function dragMoveListener(event) {
  const target = event.target;
  // keep the dragged position in the data-x/data-y attributes
  const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
  const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

  // translate the element
  target.style.transform = `translate(${x}px, ${y}px)`;

  // update the posiion attributes
  target.setAttribute('data-x', x);
  target.setAttribute('data-y', y);

  // Update State
  if (target.id === 'qrElement') {
      state.qrPosition = { x, y };
  } else if (target.id === 'textElement') {
      state.textPosition = { x, y };
  }
}

function updateElementPosition(element, pos) {
    element.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
    element.setAttribute('data-x', pos.x);
    element.setAttribute('data-y', pos.y);
}

// --- Preview Updates ---

async function updatePreview() {
    // 1. Update QR Code
    // Use first row data or placeholder
    const sampleData = state.excelData.length > 0 && state.selectedQrColumn 
        ? String(state.excelData[0][state.selectedQrColumn] || 'Sample QR')
        : 'Sample QR';

    const colorDark = state.qrColor;
    
    try {
        const qrDataUrl = await QRCode.toDataURL(sampleData, {
            width: state.qrSize,
            margin: 0,
            color: {
                dark: colorDark,
                light: '#00000000' // Transparent background
            }
        });
        qrPlaceholder.innerHTML = `<img src="${qrDataUrl}" draggable="false">`;
    } catch (err) {
        console.error(err);
    }
    
    // 2. Update Text
    const sampleText = state.excelData.length > 0 && state.selectedTextColumn
        ? String(state.excelData[0][state.selectedTextColumn] || 'Sample Text')
        : (state.selectedTextColumn ? 'Sample Text' : '');
    
    textPlaceholder.textContent = sampleText;
    textPlaceholder.style.fontSize = `${state.textSize}px`;
    textPlaceholder.style.color = state.textColor;
    
    if (!state.selectedTextColumn && state.excelData.length > 0) {
       textElement.style.opacity = '0.5'; // dimmed if not selected but available
       if (textColumnSelect.value === 'none') textElement.style.display = 'none';
    } else {
       textElement.style.display = 'block';
       textElement.style.opacity = '1';
    }

    checkGenerateButton();
}


function checkGenerateButton() {
    if (state.excelData.length > 0 && state.bgImageSrc && state.selectedQrColumn) {
        generateBtn.removeAttribute('disabled');
    } else {
        generateBtn.setAttribute('disabled', 'true');
    }
}

// --- Batch Generation ---

async function handleBatchGenerate() {
    if (!state.excelData.length || !state.bgImageSrc) return;

    generateBtn.textContent = 'Generating...';
    generateBtn.disabled = true;

    const zip = new JSZip();
    const folder = zip.folder("qr_codes");

    // Load background image once
    const bgImg = await loadImage(state.bgImageSrc);
    
    // Get scale factor (Displayed vs Natural size)
    // We need to map the DOM coordinates to the actual image coordinates.
    const displayedWidth = previewBg.clientWidth;
    const displayedHeight = previewBg.clientHeight;
    const naturalWidth = bgImg.naturalWidth;
    const naturalHeight = bgImg.naturalHeight;
    
    const scaleX = naturalWidth / displayedWidth;
    const scaleY = naturalHeight / displayedHeight;

    for (let i = 0; i < state.excelData.length; i++) {
        const row = state.excelData[i];
        const qrContent = String(row[state.selectedQrColumn] || '');
        if (!qrContent) continue;
        
        const textContent = state.selectedTextColumn ? String(row[state.selectedTextColumn] || '') : '';

        // Generate Canvas
        const canvas = document.createElement('canvas');
        canvas.width = naturalWidth;
        canvas.height = naturalHeight;
        const ctx = canvas.getContext('2d');

        // Draw Background
        ctx.drawImage(bgImg, 0, 0);

        // Calculate mapped positions
        // QR Position
        const mappedQrX = state.qrPosition.x * scaleX;
        const mappedQrY = state.qrPosition.y * scaleY;
        const mappedQrSize = state.qrSize * scaleX; // Assuming uniform scaling for simplicity, or we can just use scaleX

        // Generate QR on separate canvas or directly?
        // Let's generate a data URL then draw it.
        const qrDataUrl = await QRCode.toDataURL(qrContent, {
            width: mappedQrSize,
            margin: 0,
            color: {
                dark: state.qrColor,
                light: '#00000000'
            }
        });
        const qrImg = await loadImage(qrDataUrl);
        ctx.drawImage(qrImg, mappedQrX, mappedQrY, mappedQrSize, mappedQrSize); // Draw as a square

        // Draw Text
        if (state.selectedTextColumn && textContent) {
           const mappedTextX = state.textPosition.x * scaleX;
           const mappedTextY = state.textPosition.y * scaleY; // Top-left of the text element?
           // Text metrics are tricky. 
           // In CSS we set font-size. We need to scale that too.
           const mappedFontSize = state.textSize * scaleX;
           
           ctx.font = `${mappedFontSize}px Inter, sans-serif`;
           ctx.fillStyle = state.textColor;
           ctx.textBaseline = 'top'; 
           // Add a bit of padding logic if needed, but for now exact pos
           // Note: The text element in DOM might have padding. 
           // Ideally we'd measure the DOM offset relative to the image container.
           // For MVP, we use the top-left of the <div>.
           ctx.fillText(textContent, mappedTextX, mappedTextY); 
        }

        // Add to Zip
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        // Filename preference: QR content or Index? Let's use Index + QR start to be safe
        const safeName = qrContent.replace(/[^a-z0-9]/gi, '_').substring(0, 20);
        folder.file(`${i+1}_${safeName}.png`, blob);
    } // end for

    // Save Zip
    const content = await zip.generateAsync({type:"blob"});
    saveAs(content, "qr_codes_batch.zip");

    generateBtn.textContent = 'Generate Batch 🚀';
    generateBtn.disabled = false;
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

init();
