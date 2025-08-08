/**
 * WorkflowGeneratedNotification - Shows when a workflow is generated from chat
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ArrowRight, X, GitBranch } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkflowGeneratedNotificationProps {
  workflow: any;
  isVisible: boolean;
  onView: () => void;
  onDismiss: () => void;
}

export const WorkflowGeneratedNotification: React.FC<WorkflowGeneratedNotificationProps> = ({
  workflow,
  isVisible,
  onView,
  onDismiss,
}) => {
  if (!workflow) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ duration: 0.3, type: 'spring' }}
          className="fixed bottom-24 right-4 z-50 max-w-md"
        >
          <Card className="shadow-xl border-2 border-primary/20 bg-gradient-to-br from-white to-primary/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        Workflow Generated!
                        <Badge variant="secondary" className="text-xs">
                          <GitBranch className="h-3 w-3 mr-1" />
                          {workflow.nodes?.length || 0} nodes
                        </Badge>
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {workflow.name || 'New Workflow'}
                      </p>
                      {workflow.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {workflow.description}
                        </p>
                      )}
                    </div>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 -mt-1 -mr-1"
                      onClick={onDismiss}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={onView}
                    >
                      View Workflow
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onDismiss}
                    >
                      Later
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};