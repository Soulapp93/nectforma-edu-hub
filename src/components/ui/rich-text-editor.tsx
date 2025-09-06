import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bold, Italic, Underline, List, ListOrdered, Type, AlignLeft, AlignCenter, AlignRight, Link, Palette, Undo, Redo, Quote, Code, Strikethrough, Subscript, Superscript } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Tapez votre texte ici...",
  rows = 8
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [currentColor, setCurrentColor] = useState('#000000');

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const formatText = (format: string) => {
    switch (format) {
      case 'bold':
        execCommand('bold');
        break;
      case 'italic':
        execCommand('italic');
        break;
      case 'underline':
        execCommand('underline');
        break;
      case 'strikethrough':
        execCommand('strikeThrough');
        break;
      case 'subscript':
        execCommand('subscript');
        break;
      case 'superscript':
        execCommand('superscript');
        break;
      case 'bullet':
        execCommand('insertUnorderedList');
        break;
      case 'number':
        execCommand('insertOrderedList');
        break;
      case 'indent':
        execCommand('indent');
        break;
      case 'outdent':
        execCommand('outdent');
        break;
      case 'alignLeft':
        execCommand('justifyLeft');
        break;
      case 'alignCenter':
        execCommand('justifyCenter');
        break;
      case 'alignRight':
        execCommand('justifyRight');
        break;
      case 'justifyFull':
        execCommand('justifyFull');
        break;
      case 'blockquote':
        execCommand('formatBlock', 'blockquote');
        break;
      case 'code':
        execCommand('formatBlock', 'pre');
        break;
      case 'h1':
        execCommand('formatBlock', 'h1');
        break;
      case 'h2':
        execCommand('formatBlock', 'h2');
        break;
      case 'h3':
        execCommand('formatBlock', 'h3');
        break;
      case 'h4':
        execCommand('formatBlock', 'h4');
        break;
      case 'normal':
        execCommand('formatBlock', 'div');
        break;
      case 'undo':
        execCommand('undo');
        break;
      case 'redo':
        execCommand('redo');
        break;
    }
  };

  const insertLink = () => {
    const url = prompt('Entrez l\'URL du lien:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  const changeTextColor = (color: string) => {
    execCommand('foreColor', color);
    setCurrentColor(color);
  };

  const changeBackgroundColor = (color: string) => {
    execCommand('backColor', color);
  };

  const insertImage = () => {
    const url = prompt('Entrez l\'URL de l\'image:');
    if (url) {
      execCommand('insertImage', url);
    }
  };

  // Convert HTML to plain text for storage if needed
  const getPlainText = () => {
    if (editorRef.current) {
      return editorRef.current.innerText;
    }
    return '';
  };

  return (
    <div className="border rounded-md">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b bg-muted/50 flex-wrap">
        {/* Undo/Redo */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatText('undo')}
          title="Annuler (Ctrl+Z)"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatText('redo')}
          title="Refaire (Ctrl+Y)"
        >
          <Redo className="h-4 w-4" />
        </Button>

        <div className="w-px h-4 bg-border mx-1" />

        {/* Style dropdown */}
        <Select 
          defaultValue="normal" 
          onValueChange={formatText}
        >
          <SelectTrigger className="w-32 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-background border z-50">
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="h1">Titre 1</SelectItem>
            <SelectItem value="h2">Titre 2</SelectItem>
            <SelectItem value="h3">Titre 3</SelectItem>
            <SelectItem value="h4">Titre 4</SelectItem>
            <SelectItem value="blockquote">Citation</SelectItem>
            <SelectItem value="code">Code</SelectItem>
          </SelectContent>
        </Select>

        <div className="w-px h-4 bg-border mx-1" />

        {/* Text formatting */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatText('bold')}
          title="Gras (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatText('italic')}
          title="Italique (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatText('underline')}
          title="Souligné (Ctrl+U)"
        >
          <Underline className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatText('strikethrough')}
          title="Barré"
        >
          <Strikethrough className="h-4 w-4" />
        </Button>

        <div className="w-px h-4 bg-border mx-1" />

        {/* Text color */}
        <div className="relative">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowColorPicker(!showColorPicker)}
            title="Couleur du texte"
          >
            <Palette className="h-4 w-4" />
          </Button>
          {showColorPicker && (
            <div className="absolute top-8 left-0 z-50 bg-background border rounded-md p-2 shadow-lg">
              <div className="grid grid-cols-6 gap-1 mb-2">
                {['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#008000', '#000080', '#800000'].map((color) => (
                  <button
                    key={color}
                    className="w-6 h-6 rounded border-2 border-gray-300 hover:border-gray-500"
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      changeTextColor(color);
                      setShowColorPicker(false);
                    }}
                  />
                ))}
              </div>
              <input
                type="color"
                value={currentColor}
                onChange={(e) => changeTextColor(e.target.value)}
                className="w-full h-8"
              />
            </div>
          )}
        </div>

        <div className="w-px h-4 bg-border mx-1" />

        {/* Alignment */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatText('alignLeft')}
          title="Aligner à gauche"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatText('alignCenter')}
          title="Centrer"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatText('alignRight')}
          title="Aligner à droite"
        >
          <AlignRight className="h-4 w-4" />
        </Button>

        <div className="w-px h-4 bg-border mx-1" />

        {/* Lists */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatText('bullet')}
          title="Liste à puces"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatText('number')}
          title="Liste numérotée"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <div className="w-px h-4 bg-border mx-1" />

        {/* Additional tools */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={insertLink}
          title="Insérer un lien"
        >
          <Link className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatText('subscript')}
          title="Indice"
        >
          <Subscript className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => formatText('superscript')}
          title="Exposant"
        >
          <Superscript className="h-4 w-4" />
        </Button>

        <div className="w-px h-4 bg-border mx-1" />

        {/* Preview toggle */}
        <Button
          type="button"
          variant={isPreview ? "default" : "ghost"}
          size="sm"
          onClick={() => setIsPreview(!isPreview)}
          title="Aperçu"
        >
          <Type className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor */}
      {isPreview ? (
        <div 
          className="p-3 min-h-[200px] prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: value }}
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          className="p-3 min-h-[200px] outline-none prose prose-sm max-w-none"
          style={{ minHeight: `${rows * 1.5}rem` }}
          dangerouslySetInnerHTML={{ __html: value }}
          suppressContentEditableWarning={true}
          onKeyDown={(e) => {
            // Handle keyboard shortcuts
            if (e.ctrlKey || e.metaKey) {
              switch (e.key) {
                case 'b':
                  e.preventDefault();
                  formatText('bold');
                  break;
                case 'i':
                  e.preventDefault();
                  formatText('italic');
                  break;
                case 'u':
                  e.preventDefault();
                  formatText('underline');
                  break;
              }
            }
          }}
        />
      )}
      
      {!value && !isPreview && (
        <div className="absolute top-[60px] left-3 text-muted-foreground pointer-events-none">
          {placeholder}
        </div>
      )}
    </div>
  );
};