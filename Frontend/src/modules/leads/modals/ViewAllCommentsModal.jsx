import React from 'react';
import { API_BASE_URL } from "@shared/api/client";
import { sanitizeHtml } from "@shared/security/sanitizeHtml";
import { MdClose, MdEdit, MdDelete } from 'react-icons/md';
import { FaRegSmile, FaRegThumbsUp, FaThumbsUp, FaReply } from 'react-icons/fa';

const ViewAllCommentsModal = ({ 
  isOpen, 
  onClose, 
  commentsList,
  loadingComments,
  getCurrentUser,
  getUserData,
  getRelativeTime,
  getCommentId,
  editingId,
  setEditingId,
  handleToggleLike,
  handleAddReaction,
  handleDeleteComment,
  handleSaveCommentEdit,
  isLiked,
  getLikeCount,
  getReactions,
  hasUserReacted,
  showEmojiPicker,
  setShowEmojiPicker,
  emojiPickerRef,
  EMOJI_OPTIONS,
  editRef,
  editorRef
}) => {
  if (!isOpen) return null;

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

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-800">All Comments</h3>
            <span className="text-xs text-gray-600 bg-white px-3 py-1 rounded-full shadow-sm">
              {commentsList.length} comments
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/50 transition-colors"
          >
            <MdClose size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
          {loadingComments ? (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mr-3"></div>
              Loading conversation...
            </div>
          ) : commentsList?.length ? (
            commentsList.map((c, idx) => {
              const id = getCommentId(c, idx);
              const text = c.comment_text || c.text || c.html || '';
              const created = getRelativeTime(c.created_at);
              const isEditing = editingId === id;
              
              // Get user data from backend response
              const createdByUsername = c.created_by || '';
              const userFullName = c.user_username || c.user_email || createdByUsername || 'Unknown User';
              const userProfileImage = c.user_profile_image || null;
              
              const currentUser = getCurrentUser();
              
              // Create user data object
              const commentUserData = {
                username: createdByUsername,
                fullName: userFullName,
                profileImage: userProfileImage
              };
              
              // Determine if this is the current user's comment
              const isMe = String(createdByUsername).toLowerCase().trim() === String(currentUser.username).toLowerCase().trim() ||
                           String(userFullName).toLowerCase().trim() === String(currentUser.fullName).toLowerCase().trim();
              
              // If it's the current user, use their local profile data
              if (isMe) {
                commentUserData.fullName = currentUser.fullName;
                commentUserData.profileImage = currentUser.profileImage;
              }

              return (
                <div key={id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {commentUserData.profileImage ? (
                      <img 
                        src={commentUserData.profileImage?.startsWith('http') || commentUserData.profileImage?.startsWith('data:') ? commentUserData.profileImage : `${API_BASE_URL}/${commentUserData.profileImage.startsWith('/') ? commentUserData.profileImage.slice(1) : commentUserData.profileImage}`} 
                        alt={commentUserData.fullName}
                        className="w-10 h-10 rounded-full object-cover shadow-sm border border-gray-200"
                      />
                    ) : (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm border border-white ${
                        isMe ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {commentUserData.fullName ? commentUserData.fullName.charAt(0).toUpperCase() : 'U'}
                      </div>
                    )}
                  </div>

                  {/* Comment Bubble */}
                  <div className={`flex flex-col max-w-[85%] ${isMe ? 'items-end' : 'items-start'}`}>
                    {/* Username and Time */}
                    <div className={`flex items-center gap-2 mb-1 px-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                      <span className="text-sm font-semibold text-gray -700">{commentUserData.fullName}</span>
                      <span className="text-[11px] text-gray-400">{created}</span>
                    </div>

                    {!isEditing ? (
                      <>
                        <div className={`relative rounded-2xl px-4 py-3 text-sm shadow-sm ${
                          isMe
                            ? 'bg-green-50 text-gray-800 rounded-tr-none border border-green-200' 
                            : 'bg-white text-gray-800 rounded-tl-none border border-gray-200'
                        }`}>
                          {/* Reply handling */}
                          {(() => {
                            const mentionMatch = text.match(/<strong>@([^<]+)<\/strong>/);
                            if (mentionMatch) {
                              const mentionedUsername = mentionMatch[1];
                              const mentionedUserData = getUserData(mentionedUsername);
                              
                              const replyTextMatch = text.match(/<span data-reply-text="([^"]+)"/);
                              const replyText = replyTextMatch ? replyTextMatch[1] : 'Replying to this user';
                              
                              const restOfText = text
                                .replace(/<strong>@[^<]+<\/strong>\s*/, '')
                                .replace(/<span data-reply-text="[^"]+"[^>]*><\/span>/, '');
                              
                              return (
                                <div className="flex flex-col gap-2">
                                  <div className="flex items-center gap-2 pl-3 border-l-[3px] border-green-500 bg-green-100/50 py-2 rounded-r-md">
                                    <div className="flex flex-col">
                                      <span className="text-[11px] font-bold text-green-800">
                                        {mentionedUserData.fullName}
                                      </span>
                                      <span className="text-[10px] text-green-700/80 line-clamp-1 italic">
                                        {replyText}
                                      </span>
                                    </div>
                                  </div>
                                  <div
                                    dangerouslySetInnerHTML={{
                                      __html: sanitizeHtml(restOfText),
                                    }}
                                    className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
                                  />
                                </div>
                              );
                            } else {
                              return (
                                <div
                                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(text) }}
                                  className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
                                />
                              );
                            }
                          })()}
                        </div>

                        {/* Action Buttons */}
                        <div className={`flex items-center gap-2 mt-1.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                          {/* Like Button */}
                          <button
                            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors ${
                              isLiked(id) ? 'text-blue-600 hover:bg-blue-50' : 'text-gray-500 hover:bg-gray-100'
                            }`}
                            onClick={() => handleToggleLike(id)}
                          >
                            {isLiked(id) ? <FaThumbsUp size={12} /> : <FaRegThumbsUp size={12} />}
                            {getLikeCount(id) > 0 && <span>{getLikeCount(id)}</span>}
                          </button>

                          {/* Emoji Reaction Button */}
                          <div className="relative">
                            <button
                              className="flex items-center gap-1 px-2 py-1 rounded-full text-xs text-gray-500 hover:bg-gray-100 transition-colors"
                              onClick={() => setShowEmojiPicker(showEmojiPicker === id ? null : id)}
                            >
                              <FaRegSmile size={12} />
                              {Object.keys(getReactions(id)).length > 0 && (
                                <span className="flex items-center gap-0.5">
                                  {Object.entries(getReactions(id)).map(([emoji, count]) => (
                                    <span key={emoji} className="flex items-center">
                                      {emoji}
                                      {count > 1 && <span className="text-[10px] ml-0.5">{count}</span>}
                                    </span>
                                  ))}
                                </span>
                              )}
                            </button>
                            {showEmojiPicker === id && (
                              <div
                                ref={emojiPickerRef}
                                className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-xl p-2 z-50 flex gap-1"
                              >
                                {EMOJI_OPTIONS.map((emoji) => {
                                  const hasReacted = hasUserReacted(id, emoji);
                                  return (
                                    <button
                                      key={emoji}
                                      className={`text-lg hover:scale-125 transition-transform p-1.5 rounded-md ${
                                        hasReacted ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                                      }`}
                                      onClick={() => handleAddReaction(id, emoji)}
                                    >
                                      {emoji}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* Reply Button */}
                          <button
                            className="flex items-center gap-1 px-2 py-1 rounded-full text-xs text-gray-500 hover:bg-gray-100 transition-colors"
                            onClick={() => {
                              if (editorRef.current) {
                                const tempDiv = document.createElement('div');
                                tempDiv.innerHTML = sanitizeHtml(text);
                                let plainText = tempDiv.textContent || tempDiv.innerText || '';
                                plainText = plainText.replace(/<strong>@[^<]+<\/strong>/g, '').replace(/<span data-reply-text="[^"]+"[^>]*><\/span>/g, '').trim();
                                if (plainText.length > 60) plainText = plainText.substring(0, 60) + '...';

                                  // Build reply header safely without string-based innerHTML.
                                  editorRef.current.innerHTML = '';
                                  const mention = document.createElement('strong');
                                  mention.textContent = `@${commentUserData.fullName}`;

                                  const replySpan = document.createElement('span');
                                  replySpan.setAttribute('data-reply-text', plainText);
                                  replySpan.style.display = 'none';

                                  editorRef.current.appendChild(mention);
                                  editorRef.current.appendChild(replySpan);
                                  editorRef.current.appendChild(document.createTextNode('\u00A0'));

                                editorRef.current.focus();
                                const range = document.createRange();
                                const sel = window.getSelection();
                                range.selectNodeContents(editorRef.current);
                                range.collapse(false);
                                sel.removeAllRanges();
                                sel.addRange(range);
                              }
                              onClose(); // Close this modal to allow user to type reply
                            }}
                          >
                            <FaReply size={12} />
                            Reply
                          </button>

                          {/* Edit Button */}
                          <button
                            className="p-2 rounded-full text-blue-600 hover:bg-blue-100 hover:scale-110 transition-all"
                            onClick={() => {
                              setEditingId(id);
                              setTimeout(() => {
                                if (editRef.current) {
                                  editRef.current.innerHTML = sanitizeHtml(text);
                                  editRef.current.focus();
                                }
                              }, 0);
                            }}
                            title="Edit comment"
                          >
                            <MdEdit size={18} />
                          </button>

                          {/* Delete Button */}
                          <button
                            className="p-2 rounded-full text-red-600 hover:bg-red-100 hover:scale-110 transition-all"
                            onClick={() => handleDeleteComment(id)}
                            title="Delete comment"
                          >
                            <MdDelete size={18} />
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="w-full min-w-[400px] bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
                        <div className="flex items-center gap-1 border-b bg-gray-50 px-2 py-1.5">
                          <ToolbarButton onClick={() => document.execCommand('bold')} label="B" bold />
                          <ToolbarButton onClick={() => document.execCommand('italic')} label="I" italic />
                          <ToolbarButton onClick={() => document.execCommand('underline')} label="U" underline />
                        </div>

                        <div
                          ref={editRef}
                          contentEditable
                          className="min-h-[100px] max-h-[200px] overflow-y-auto w-full px-4 py-3 text-sm outline-none"
                          data-placeholder="Edit your comment..."
                        />

                        <div className="flex justify-end gap-2 px-3 py-2 bg-gray-50 border-t">
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-200 rounded transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (editRef.current) {
                                const updatedRaw = editRef.current.innerHTML.trim();
                                const updated = sanitizeHtml(updatedRaw);
                                handleSaveCommentEdit(id, updated);
                              }
                            }}
                            className="px-3 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm py-12">
              <FaRegSmile size={40} className="mb-3 opacity-50" />
              <p className="text-base">No comments yet. Start the conversation!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewAllCommentsModal;
