import { useState, useCallback } from 'react';

export function usePDFExtraction() {
  const [showPanel, setShowPanel] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');
  const [extractionPrompt, setExtractionPrompt] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);

  const togglePanel = useCallback(() => {
    setShowPanel(prev => !prev);
  }, []);

  const hidePanel = useCallback(() => {
    setShowPanel(false);
  }, []);

  const handleExtraction = useCallback(async (
    extractAll: boolean,
    onStatusUpdate: (messageId: string, content: string) => void,
    onComplete: (success: boolean) => void
  ) => {
    if (!pdfUrl.trim()) {
      alert('Please enter a PDF URL');
      return;
    }

    setIsExtracting(true);
    const messageId = `pdf_extraction_${Date.now()}`;
    
    try {
      // Simulate PDF extraction process
      onStatusUpdate(messageId, '🔄 Starting PDF extraction...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onStatusUpdate(messageId, '📄 Analyzing PDF structure...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      onStatusUpdate(messageId, '🎯 Extracting content...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const extractedContent = extractAll ? 
        'Successfully extracted all content from the PDF document.' :
        `Successfully extracted content matching: "${extractionPrompt}"`;
      
      onStatusUpdate(messageId, `✅ ${extractedContent}`);
      onComplete(true);
      
      // Reset form
      setPdfUrl('');
      setExtractionPrompt('');
      setShowPanel(false);
      
    } catch (error) {
      onStatusUpdate(messageId, `❌ PDF extraction failed: ${error}`);
      onComplete(false);
    } finally {
      setIsExtracting(false);
    }
  }, [pdfUrl, extractionPrompt]);

  const canExtractAll = !isExtracting && pdfUrl.trim().length > 0;
  const canExtractSpecific = !isExtracting && pdfUrl.trim().length > 0 && extractionPrompt.trim().length > 0;

  return {
    showPanel,
    pdfUrl,
    setPdfUrl,
    extractionPrompt,
    setExtractionPrompt,
    isExtracting,
    togglePanel,
    hidePanel,
    handleExtraction,
    canExtractAll,
    canExtractSpecific
  };
}