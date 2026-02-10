import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid'; // Need uuid for keys

export const useQRGenerator = () => {
    // Excel Data
    const [excelData, setExcelData] = useState([]);
    const [headers, setHeaders] = useState([]);
    const [excelFileName, setExcelFileName] = useState(null);

    // Mappings & State
    const [selectedQrColumn, setSelectedQrColumn] = useState('');

    // Multiple Text Elements
    // { id, column, customText, x, y, fontSize, fontFamily, color }
    const [textElements, setTextElements] = useState([]);
    const [selectedElementId, setSelectedElementId] = useState(null); // 'qr' or text-uuid

    // Background
    const [bgImage, setBgImage] = useState(null); // Image object for canvas
    const [bgImageSrc, setBgImageSrc] = useState(null); // Data URL for preview
    const [bgFileName, setBgFileName] = useState(null);
    const [bgDimensions, setBgDimensions] = useState({ width: 0, height: 0 });

    // QR Settings
    const [qrSize, setQrSize] = useState([150]); // Slider uses array
    const [qrColor, setQrColor] = useState('#000000');

    // Positions (Relative to 0,0 of the container)
    const [qrPosition, setQrPosition] = useState({ x: 50, y: 50 });

    // Loading State
    const [isGenerating, setIsGenerating] = useState(false);

    // --- Actions ---

    const handleExcelUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setExcelFileName(file.name);

        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(sheet, { header: 1 }); // Header row

            if (json.length > 0) {
                setHeaders(json[0].map(String)); // Ensure strings
                // Parse full data object
                const jsonData = XLSX.utils.sheet_to_json(sheet);
                setExcelData(jsonData);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleBgUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setBgFileName(file.name);

        const reader = new FileReader();
        reader.onload = (e) => {
            const src = e.target.result;
            setBgImageSrc(src);

            const img = new Image();
            img.onload = () => {
                setBgDimensions({ width: img.naturalWidth, height: img.naturalHeight });
                setBgImage(img);
            };
            img.src = src;
        };
        reader.readAsDataURL(file);
    };

    // Text Element Handlers
    const addTextElement = () => {
        const newElement = {
            id: uuidv4(),
            column: 'none', // Use 'none' for static text
            customText: 'Sample Text', // For static text or fallback
            x: 50,
            y: 200 + (textElements.length * 30), // Offset slightly
            fontSize: [24],
            fontFamily: 'Inter',
            color: '#000000'
        };
        setTextElements([...textElements, newElement]);
        setSelectedElementId(newElement.id);
    };

    const updateTextElement = (id, updates) => {
        setTextElements(prev => prev.map(el =>
            el.id === id ? { ...el, ...updates } : el
        ));
    };

    const removeTextElement = (id) => {
        setTextElements(prev => prev.filter(el => el.id !== id));
        if (selectedElementId === id) setSelectedElementId(null);
    };

    // --- Helpers ---

    // Get sample data for preview
    const sampleQrData = excelData.length > 0 && selectedQrColumn
        ? String(excelData[0][selectedQrColumn] || 'Sample QR')
        : 'Sample QR';

    const getSampleText = (element) => {
        if (element.column && excelData.length > 0) {
            return String(excelData[0][element.column] || element.customText || 'Data');
        }
        return element.customText || 'Text';
    };

    const isReadyToGenerate = excelData.length > 0 && bgImageSrc && selectedQrColumn && bgImage;

    return {
        // State
        excelData,
        headers,
        excelFileName,
        selectedQrColumn,

        textElements,
        selectedElementId,

        bgImageSrc,
        bgFileName,
        bgDimensions,
        bgImage,

        qrSize,
        qrColor,
        qrPosition,

        isGenerating,

        // Computed
        sampleQrData,
        getSampleText,
        isReadyToGenerate,

        // Setters
        setSelectedQrColumn,
        setQrSize,
        setQrColor,
        setQrPosition,
        setIsGenerating,

        setSelectedElementId,
        addTextElement,
        updateTextElement,
        removeTextElement,

        // Handlers
        handleExcelUpload,
        handleBgUpload
    };
};
