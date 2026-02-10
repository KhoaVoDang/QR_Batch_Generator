import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Upload, Image as ImageIcon, Download } from 'lucide-react';

const Sidebar = ({
    headers,
    excelFileName,
    handleExcelUpload,
    bgFileName,
    handleBgUpload,

    selectedQrColumn,
    setSelectedQrColumn,

    handleGenerateBatch,
    isGenerating,
    isReadyToGenerate
}) => {
    return (
        <aside className="w-72 bg-background border-r border-border flex flex-col h-full shadow-[5px_0_30px_-5px_rgba(0,0,0,0.03)] z-10">
            <div className="p-6">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    QR Gen
                </h1>
                <p className="text-xs text-muted-foreground mt-1 font-medium">Batch Generator</p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">

                {/* Upload Section */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Excel Source</Label>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" className="w-full relative overflow-hidden group">
                                <Upload className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                                {excelFileName ? 'Change File' : 'Upload .xlsx'}
                                <input
                                    type="file"
                                    accept=".xlsx, .xls"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={handleExcelUpload}
                                />
                            </Button>
                        </div>
                        {excelFileName && <p className="text-xs text-green-500 truncate">✓ {excelFileName}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label>Background Image</Label>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" className="w-full relative overflow-hidden group border-dashed">
                                <ImageIcon className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                                {bgFileName ? 'Change Image' : 'Upload Image'}
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={handleBgUpload}
                                />
                            </Button>
                        </div>
                        {bgFileName && <p className="text-xs text-green-500 truncate">✓ {bgFileName}</p>}
                    </div>
                </div>

                <div className="h-px bg-border/50" />

                {/* Mapping Section */}
                <div className="space-y-4">
                    <Label className="text-xs uppercase text-muted-foreground tracking-wider">Data Source</Label>

                    <div className="space-y-2">
                        <Label>QR Data Column</Label>
                        <Select
                            value={selectedQrColumn}
                            onValueChange={setSelectedQrColumn}
                            disabled={headers.length === 0}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Column" />
                            </SelectTrigger>
                            <SelectContent>
                                {headers.map(h => (
                                    <SelectItem key={h} value={h}>{h}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

            </div>

            <div className="p-6 border-t border-border bg-background">
                <Button
                    className="w-full font-semibold shadow-sm hover:shadow-md transition-all"
                    size="lg"
                    disabled={!isReadyToGenerate || isGenerating}
                    onClick={handleGenerateBatch}
                >
                    {isGenerating ? (
                        <>Generating...</>
                    ) : (
                        <>
                            Generate Batch <Download className="w-4 h-4 ml-2" />
                        </>
                    )}
                </Button>
            </div>
        </aside>
    );
};

export default Sidebar;
