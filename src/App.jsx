import { useState } from 'react';
import { useQRGenerator } from './hooks/useQRGenerator';
import Sidebar from './components/Sidebar';
import RightSidebar from './components/RightSidebar'; // New import
import PreviewArea from './components/PreviewArea';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import QRCode from 'qrcode';

function App() {
    const {
        // State
        excelData,
        headers,
        excelFileName,
        selectedQrColumn,

        textElements,
        selectedElementId,

        bgImageSrc,
        bgFileName,
        bgImage,

        qrSize,
        qrColor,
        qrPosition,

        isGenerating,

        // Computed
        sampleQrData,
        getSampleText,
        isReadyToGenerate,

        // Setters & Handlers
        setSelectedQrColumn,
        setQrSize,
        setQrColor,
        setQrPosition,
        setIsGenerating,

        setSelectedElementId,
        addTextElement,
        updateTextElement,
        removeTextElement,

        handleExcelUpload,
        handleBgUpload
    } = useQRGenerator();

    // --- Batch Generation Logic ---
    const handleGenerateBatch = async () => {
        if (!isReadyToGenerate || !bgImage) return;
        setIsGenerating(true);

        try {
            const zip = new JSZip();
            const folder = zip.folder("qr_codes");

            // Image Dimensions & Scale (Same logic as before)
            const naturalWidth = bgImage.naturalWidth;
            const naturalHeight = bgImage.naturalHeight;

            // We need to measure the *actual rendered size* of the container to calculate scale.
            // The container in PreviewArea has class 'relative shadow-xl ring-1 ...'
            const containerElement = document.querySelector('.relative.shadow-xl');
            if (!containerElement) {
                console.error("Preview container not found. Class name mismatch?");
                throw new Error("Preview container not found. Please ensure the preview is visible.");
            }

            const displayedWidth = containerElement.clientWidth;
            const displayedHeight = containerElement.clientHeight;

            const scaleX = naturalWidth / displayedWidth;
            const scaleY = naturalHeight / displayedHeight;

            for (let i = 0; i < excelData.length; i++) {
                const row = excelData[i];
                const qrContent = String(row[selectedQrColumn] || '');
                if (!qrContent) continue;

                const canvas = document.createElement('canvas');
                canvas.width = naturalWidth;
                canvas.height = naturalHeight;
                const ctx = canvas.getContext('2d');

                // Draw Background
                ctx.drawImage(bgImage, 0, 0);

                // Draw QR
                const mappedQrX = qrPosition.x * scaleX;
                const mappedQrY = qrPosition.y * scaleY;
                const mappedQrSize = qrSize[0] * scaleX;

                const qrDataUrl = await QRCode.toDataURL(qrContent, {
                    width: mappedQrSize,
                    margin: 0,
                    color: { dark: qrColor, light: '#00000000' }
                });

                const qrImg = await loadImage(qrDataUrl);
                ctx.drawImage(qrImg, mappedQrX, mappedQrY, mappedQrSize, mappedQrSize);

                // Draw ALL Text Elements
                textElements.forEach(el => {
                    let textContent = el.customText;
                    if (el.column && el.column !== 'none' && row[el.column]) {
                        textContent = String(row[el.column]);
                    }

                    if (textContent) {
                        const mappedTextX = el.x * scaleX;
                        const mappedTextY = el.y * scaleY;
                        const mappedFontSize = el.fontSize[0] * scaleX;

                        ctx.font = `${mappedFontSize}px ${el.fontFamily}, sans-serif`;
                        ctx.fillStyle = el.color;
                        ctx.textBaseline = 'top';
                        ctx.fillText(textContent, mappedTextX, mappedTextY);
                    }
                });

                const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
                const safeName = qrContent.replace(/[^a-z0-9]/gi, '_').substring(0, 20);
                folder.file(`${i + 1}_${safeName}.png`, blob);
            }

            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, "qr_codes_batch.zip");

        } catch (err) {
            console.error("Batch Generation Error", err);
            alert("An error occurred during generation.");
        } finally {
            setIsGenerating(false);
        }
    };

    const loadImage = (src) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }

    return (
        <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
            {/* Left Sidebar - Data Source */}
            <Sidebar
                headers={headers}
                excelFileName={excelFileName}
                handleExcelUpload={handleExcelUpload}
                bgFileName={bgFileName}
                handleBgUpload={handleBgUpload}

                selectedQrColumn={selectedQrColumn}
                setSelectedQrColumn={setSelectedQrColumn}

                handleGenerateBatch={handleGenerateBatch}
                isGenerating={isGenerating}
                isReadyToGenerate={isReadyToGenerate}
            />

            {/* Main Canvas Area */}
            <main className="flex-1 bg-muted/20 relative flex items-center justify-center p-8">
                <PreviewArea
                    bgImageSrc={bgImageSrc}

                    // QR Props
                    qrPosition={qrPosition}
                    setQrPosition={setQrPosition}
                    qrSize={qrSize}
                    qrColor={qrColor}
                    sampleQrData={sampleQrData}

                    // Text Props
                    textElements={textElements}
                    getSampleText={getSampleText}
                    updateTextElement={updateTextElement} // For position updates

                    // Selection Props
                    selectedElementId={selectedElementId}
                    setSelectedElementId={setSelectedElementId}
                />
            </main>

            {/* Right Sidebar - Properties */}
            <RightSidebar
                headers={headers}
                selectedElementId={selectedElementId}

                qrSize={qrSize}
                setQrSize={setQrSize}
                qrColor={qrColor}
                setQrColor={setQrColor}

                textElements={textElements}
                updateTextElement={updateTextElement}
                removeTextElement={removeTextElement}
                addTextElement={addTextElement}
            />
        </div>
    )
}

export default App
