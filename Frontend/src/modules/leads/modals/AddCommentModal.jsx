import React, { useRef } from 'react';
import { MdClose } from 'react-icons/md';

const ToolbarButton = ({ onClick, label, bold, italic, underline }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-2 py-1 text-xs rounded hover:bg-gray-200 transition-colors ${
      bold ? 'font-bold' : italic ? 'italic' : underline ? 'underline' : ''
    }`}
  >
    {label}
  </button>
);

const AddCommentModal = ({ isOpen, onClose, onSubmit, savingComment }) => {
  const editorRef = useRef(null);

  const exec = (command) => {
    document.execCommand(command, false, null);
    if (editorRef.current) editorRef.current.focus();
  };

  const handleSendClick = async () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML.trim();
      if (html && html !== '<br>') {
        await onSubmit(html); // Wait for the comment to be saved
        editorRef.current.innerHTML = ''; // Only clear after success
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-blue-100">
          <h3 className="text-lg font-semibold text-gray-800">Add New Comment</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/50 transition-colors"
          >
            <MdClose size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="rounded-xl border border-gray-200 shadow-sm bg-white">
            <div className="flex items-center gap-1 border-b border-gray-100 px-2 py-1.5 bg-gray-50/50 rounded-t-xl">
              <ToolbarButton onClick={() => exec('bold')} label="B" bold />
              <ToolbarButton onClick={() => exec('italic')} label="I" italic />
              <ToolbarButton onClick={() => exec('underline')} label="U" underline />
              <div className="w-px h-4 bg-gray-300 mx-1"></div>
              <ToolbarButton onClick={() => exec('insertUnorderedList')} label="• List" />
            </div>
            
            <div
              ref={editorRef}
              contentEditable
              className="min-h-[200px] max-h-[400px] overflow-y-auto w-full px-4 py-3 text-sm outline-none"
              data-placeholder="Type your comment here..."
            />

            <div className="flex justify-between items-center px-4 py-3 border-t border-gray-100 bg-gray-50/50">
              <span className="text-[10px] text-gray-400">
                Press Shift+Enter for new line
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={savingComment}
                  onClick={handleSendClick}
                  className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                >
                  {savingComment ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Comment'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddCommentModal;
