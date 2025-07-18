"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, Send, Edit3 } from "lucide-react";
import type { PromptSuggestion } from "@/components/prompt-suggestions";

interface TemplateEditorProps {
  template: string;
  editableFields?: PromptSuggestion['editableFields'];
  onSubmit: (editedContent: string) => void;
  onClose: () => void;
}

interface TemplateField {
  key: string;
  value: string;
  start: number;
  end: number;
  id: string; // 添加唯一标识
}

export function TemplateEditor({ template, editableFields, onSubmit, onClose }: TemplateEditorProps) {
  const [editedContent, setEditedContent] = useState(template);
  const [fields, setFields] = useState<TemplateField[]>([]);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  // Show animation
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Parse template to find key-value pairs
  useEffect(() => {
    const parseTemplate = () => {
      const foundFields: TemplateField[] = [];
      
      if (editableFields && editableFields.length > 0) {
        // Use configured editable fields
        editableFields.forEach(fieldConfig => {
          const pattern = new RegExp(fieldConfig.pattern.source, fieldConfig.pattern.flags);
          const matches = [...editedContent.matchAll(pattern)];
          
          matches.forEach(match => {
            if (match.index !== undefined) {
              // Handle different pattern types
              let value: string;
              let start: number;
              let end: number;
              
              if (match[1] !== undefined) {
                // Pattern has capture group
                value = match[1];
                // Find where the captured value starts within the full match
                const fullMatch = match[0];
                const captureIndex = fullMatch.indexOf(value);
                
                if (captureIndex !== -1) {
                  start = match.index + captureIndex;
                  end = start + value.length;
                } else {
                  // Fallback: if can't find exact position, use the match position
                  start = match.index;
                  end = match.index + match[0].length;
                }
              } else {
                // Pattern matches entire value (e.g., /前厅/g)
                value = match[0];
                start = match.index;
                end = match.index + match[0].length;
              }
              
              foundFields.push({
                key: fieldConfig.key,
                value: value,
                start: start,
                end: end,
                id: `${fieldConfig.key}-${start}`, // 使用key和位置生成唯一ID
              });
            }
          });
        });
      } else {
        // Fallback: try to auto-detect common patterns
        const patterns = [
          { key: "姓名", pattern: /姓名：([^，\n]+)/g },
          { key: "电话", pattern: /电话：(\d+)/g },
          { key: "性别", pattern: /性别：([男女])/g },
          { key: "年龄", pattern: /年龄：(\d+)/g },
          { key: "面试时间", pattern: /面试时间：([^，\n]+)/g },
          { key: "岗位", pattern: /岗位：([^，\n]+)/g },
          { key: "门店", pattern: /门店：([^，\n]+)/g },
        ];

        patterns.forEach(({ key, pattern }) => {
          const matches = [...editedContent.matchAll(pattern)];
          matches.forEach(match => {
            if (match.index !== undefined) {
              const value = match[1];
              const start = match.index + key.length + 1;
              foundFields.push({
                key,
                value,
                start: start,
                end: match.index + match[0].length,
                id: `${key}-${start}`,
              });
            }
          });
        });
      }

      // Sort by position
      foundFields.sort((a, b) => a.start - b.start);
      setFields(foundFields);
    };

    parseTemplate();
  }, [editedContent, editableFields]);

  const handleFieldEdit = (field: TemplateField, newValue: string) => {
    // Always use position-based replacement to avoid issues
    const before = editedContent.substring(0, field.start);
    const after = editedContent.substring(field.end);
    const newContent = before + newValue + after;
    
    setEditedContent(newContent);
    setEditingField(null);
  };

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(onClose, 150); // Wait for animation
  }, [onClose]);

  const handleSubmit = () => {
    onSubmit(editedContent);
    handleClose();
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [handleClose]);

  return (
    <div 
      className={`absolute bottom-full left-0 right-0 mb-2 mx-4 transition-all duration-150 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">编辑模板</span>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Content Editor */}
        <div className="space-y-3">
          {/* Quick Edit Fields */}
          {fields.length > 0 && (
            <div className="grid grid-cols-2 gap-2 p-3 bg-blue-50 rounded-md">
              {fields.map((field) => (
                <div key={field.id} className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{field.key}：</span>
                  {editingField === field.id ? (
                    <input
                      type="text"
                      defaultValue={field.value}
                      autoFocus
                      onBlur={(e) => {
                        const newValue = e.target.value;
                        if (newValue !== field.value) {
                          handleFieldEdit(field, newValue);
                        } else {
                          setEditingField(null);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const newValue = e.currentTarget.value;
                          if (newValue !== field.value) {
                            handleFieldEdit(field, newValue);
                          } else {
                            setEditingField(null);
                          }
                        }
                        if (e.key === 'Escape') {
                          setEditingField(null);
                        }
                      }}
                      className="flex-1 px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  ) : (
                    <button
                      onClick={() => setEditingField(field.id)}
                      className="flex-1 px-2 py-1 text-sm text-left bg-white border border-gray-200 rounded hover:border-blue-300 transition-colors"
                    >
                      {field.value}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Full Text Editor */}
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => setEditedContent(e.currentTarget.textContent || '')}
            onBlur={() => {
              // Sync content on blur to ensure consistency
              if (editorRef.current) {
                setEditedContent(editorRef.current.textContent || '');
              }
            }}
            className="min-h-[120px] max-h-[300px] overflow-y-auto p-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 whitespace-pre-wrap"
            style={{ wordBreak: 'break-word' }}
          >
            {template}
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">
              点击上方字段快速编辑，或直接修改文本
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleClose}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                className="flex items-center gap-1.5 px-4 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                发送
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}