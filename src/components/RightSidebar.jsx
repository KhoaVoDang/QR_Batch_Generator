import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Trash2, Type, QrCode } from 'lucide-react';

const RightSidebar = ({
    headers,
    selectedElementId,

    // QR Props
    qrSize,
    setQrSize,
    qrColor,
    setQrColor,

    // Text Props (Array handlers)
    textElements,
    updateTextElement,
    removeTextElement,
    addTextElement
}) => {

    const renderContent = () => {
        if (!selectedElementId) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 text-center">
                    <p className="text-sm">Select an element on the canvas to edit its properties.</p>
                </div>
            );
        }

        if (selectedElementId === 'qr') {
            return (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center gap-2 pb-4 border-b border-border">
                        <QrCode className="w-5 h-5 text-primary" />
                        <h2 className="font-semibold">QR Code Settings</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <Label>Size ({qrSize[0]}px)</Label>
                                <input
                                    type="color"
                                    value={qrColor}
                                    onChange={(e) => setQrColor(e.target.value)}
                                    className="w-5 h-5 rounded overflow-hidden p-0 border-0 cursor-pointer"
                                />
                            </div>
                            <Slider
                                value={qrSize}
                                onValueChange={setQrSize}
                                min={50}
                                max={500}
                                step={5}
                            />
                        </div>
                    </div>
                </div>
            );
        }

        // It's a text element
        const element = textElements.find(el => el.id === selectedElementId);
        if (!element) return null;

        return (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="flex items-center justify-between pb-4 border-b border-border">
                    <div className="flex items-center gap-2">
                        <Type className="w-5 h-5 text-primary" />
                        <h2 className="font-semibold">Text Settings</h2>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                        onClick={() => removeTextElement(element.id)}
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Data Source</Label>
                        <Select
                            value={element.column || 'none'}
                            onValueChange={(val) => updateTextElement(element.id, { column: val })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Column" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">-- Static / None --</SelectItem>
                                {(headers || []).map(h => (
                                    <SelectItem key={h} value={h}>{h}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {element.column === 'none' && (
                        <div className="space-y-2">
                            <Label>Static Text</Label>
                            <Input
                                value={element.customText}
                                onChange={(e) => updateTextElement(element.id, { customText: e.target.value })}
                            />
                        </div>
                    )}

                    <div className="space-y-3 pt-2">
                        <div className="flex justify-between">
                            <Label>Font Size ({element.fontSize[0]}px)</Label>
                            <input
                                type="color"
                                value={element.color}
                                onChange={(e) => updateTextElement(element.id, { color: e.target.value })}
                                className="w-5 h-5 rounded overflow-hidden p-0 border-0 cursor-pointer"
                            />
                        </div>
                        <Slider
                            value={element.fontSize}
                            onValueChange={(val) => updateTextElement(element.id, { fontSize: val })}
                            min={10}
                            max={100}
                            step={1}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Font Family</Label>
                        <Select
                            value={element.fontFamily}
                            onValueChange={(val) => updateTextElement(element.id, { fontFamily: val })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Font" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Inter">Inter</SelectItem>
                                <SelectItem value="Arial">Arial</SelectItem>
                                <SelectItem value="Verdana">Verdana</SelectItem>
                                <SelectItem value="Courier New">Courier New</SelectItem>
                                <SelectItem value="Georgia">Georgia</SelectItem>
                                <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <aside className="w-80 bg-background border-l border-border flex flex-col h-full shadow-[-5px_0_30px_-5px_rgba(0,0,0,0.03)] z-10">
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Properties</span>
                <Button size="sm" variant="outline" onClick={addTextElement} className="h-7 text-xs gap-1">
                    <Type className="w-3 h-3" /> Add Text
                </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
                {renderContent()}
            </div>
        </aside>
    );
};

export default RightSidebar;
