/**
 * CreateWorkflowDialog - Dialog for creating a new workflow
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Workflow, Code, Sparkles, Globe, FileText } from 'lucide-react';

interface CreateWorkflowDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: {
    name: string;
    description: string;
    type: 'blank' | 'template' | 'from-chat';
    template?: string;
  }) => void;
}

export const CreateWorkflowDialog: React.FC<CreateWorkflowDialogProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'blank' | 'template' | 'from-chat'>('blank');
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const templates = [
    { id: 'web-scrape', name: 'Web Scraping', icon: Globe, description: 'Extract data from websites' },
    { id: 'pdf-extract', name: 'PDF Extraction', icon: FileText, description: 'Extract tables from PDFs' },
    { id: 'ai-pipeline', name: 'AI Pipeline', icon: Sparkles, description: 'Process data with LLMs' },
    { id: 'data-transform', name: 'Data Transform', icon: Code, description: 'Transform and clean data' },
  ];

  const handleCreate = () => {
    if (!name.trim()) {
      alert('Please enter a workflow name');
      return;
    }

    onCreate({
      name: name.trim(),
      description: description.trim(),
      type,
      template: selectedTemplate,
    });

    // Reset form
    setName('');
    setDescription('');
    setType('blank');
    setSelectedTemplate('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Workflow className="h-5 w-5" />
            Create New Workflow
          </DialogTitle>
          <DialogDescription>
            Start building your data processing workflow
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Workflow Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Workflow Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Extract Product Data"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="What does this workflow do?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Creation Type */}
          <div className="space-y-2">
            <Label>Start from</Label>
            <RadioGroup value={type} onValueChange={(v) => setType(v as any)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="blank" id="blank" />
                <Label htmlFor="blank" className="font-normal cursor-pointer">
                  Blank canvas
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="template" id="template" />
                <Label htmlFor="template" className="font-normal cursor-pointer">
                  Template
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="from-chat" id="from-chat" />
                <Label htmlFor="from-chat" className="font-normal cursor-pointer">
                  Generate from description
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Template Selection */}
          {type === 'template' && (
            <div className="space-y-2">
              <Label>Choose a template</Label>
              <div className="grid grid-cols-2 gap-2">
                {templates.map((template) => {
                  const Icon = template.icon;
                  return (
                    <button
                      key={template.id}
                      onClick={() => setSelectedTemplate(template.id)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        selectedTemplate === template.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <Icon className="h-4 w-4 mt-0.5" />
                        <div className="text-left">
                          <div className="font-medium text-sm">{template.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {template.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!name.trim()}>
            Create Workflow
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};