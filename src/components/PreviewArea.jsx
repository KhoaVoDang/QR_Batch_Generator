import React, { useRef, useState, useEffect, createRef, useMemo } from 'react';
import Draggable from 'react-draggable';
import QRCode from 'qrcode';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

const PreviewArea = ({
    bgImageSrc,

    qrPosition,
    setQrPosition,
    qrSize,
    qrColor,
    sampleQrData,

    textElements,
    getSampleText,
    updateTextElement,

    selectedElementId,
    setSelectedElementId
}) => {
    const containerRef = useRef(null);
    const [qrDataUrl, setQrDataUrl] = useState(null);

    const qrRef = useRef(null);

    // Create refs for text elements dynamically
    const textRefs = useMemo(() => {
        const refs = {};
        textElements.forEach(el => {
            refs[el.id] = createRef();
        });
        return refs;
    }, [textElements]);

    // Generate QR Data URL whenever data/color/size chnages
    useEffect(() => {
        const generateQR = async () => {
            try {
                const url = await QRCode.toDataURL(sampleQrData, {
                    width: qrSize[0] * 2, // Generate larger for crispness, checking scale later?
                    margin: 0,
                    color: {
                        dark: qrColor,
                        light: '#00000000'
                    }
                });
                setQrDataUrl(url);
            } catch (err) {
                console.error(err);
            }
        };
        generateQR();
    }, [sampleQrData, qrColor, qrSize]);

    if (!bgImageSrc) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground border-2 border-dashed border-border rounded-lg p-12 bg-card/10">
                <p className="text-xl font-semibold mb-2">Start by uploading a background</p>
                <p className="text-sm">Supported formats: PNG, JPG</p>
            </div>
        );
    }

    return (
        <div
            className="relative w-full h-full flex items-center justify-center overflow-hidden p-8 rounded-lg"
            onClick={() => setSelectedElementId(null)} // Deselect backing click
        >
            <div
                ref={containerRef}
                className="relative shadow-xl ring-1 ring-black/5 rounded-sm bg-white"
                style={{
                    lineHeight: 0,
                }}
                onClick={(e) => e.stopPropagation()} // Stop deselect
            >
                <img
                    src={bgImageSrc}
                    alt="Background Preview"
                    className="max-h-[80vh] max-w-full object-contain touch-none pointer-events-none select-none rounded-[1px]"
                    draggable={false}
                />

                {/* Draggable QR */}
                <Draggable
                    nodeRef={qrRef}
                    bounds="parent"
                    position={qrPosition}
                    onStop={(e, data) => setQrPosition({ x: data.x, y: data.y })}
                    onStart={() => setSelectedElementId('qr')}
                >
                    <div
                        ref={qrRef}
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedElementId('qr');
                        }}
                        className={cn(
                            "absolute top-0 left-0 cursor-move active:cursor-grabbing hover:ring-2 ring-primary/30 rounded",
                            selectedElementId === 'qr' && "ring-2 ring-primary"
                        )}
                        style={{ width: qrSize[0], height: qrSize[0] }}
                    >
                        {qrDataUrl && (
                            <img
                                src={qrDataUrl}
                                alt="QR"
                                className="w-full h-full pointer-events-none select-none"
                            />
                        )}
                    </div>
                </Draggable>

                {/* Draggable Text Elements */}
                {textElements.map(el => (
                    <Draggable
                        key={el.id}
                        nodeRef={textRefs[el.id]}
                        bounds="parent"
                        position={{ x: el.x, y: el.y }}
                        onStop={(e, data) => updateTextElement(el.id, { x: data.x, y: data.y })}
                        onStart={() => setSelectedElementId(el.id)}
                    >
                        <div
                            ref={textRefs[el.id]}
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedElementId(el.id);
                            }}
                            className={cn(
                                "absolute top-0 left-0 cursor-move active:cursor-grabbing hover:ring-2 ring-primary/30 rounded px-1 min-w-[20px] whitespace-nowrap",
                                selectedElementId === el.id && "ring-2 ring-primary"
                            )}
                            style={{
                                color: el.color,
                                fontSize: `${el.fontSize[0]}px`,
                                fontFamily: el.fontFamily,
                                lineHeight: '1.2'
                            }}
                        >
                            {getSampleText(el)}
                        </div>
                    </Draggable>
                ))}
            </div>
        </div>
    );
};

export default PreviewArea;
