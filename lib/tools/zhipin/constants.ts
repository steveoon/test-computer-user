/**
 * Selector constants for Zhipin automation
 */

// Unread candidates selectors
export const UNREAD_SELECTORS = {
  // Main container for unread items
  container: '.chat-list-wrap',
  
  // Individual unread item
  item: '.chat-item',
  
  // Unread badge/count
  unreadBadge: '.unread-count',
  unreadDot: '.red-dot',
  
  // Candidate name in list
  candidateName: '.candidate-name',
  candidateNameAlt: '.chat-item-name',
  
  // Last message preview
  lastMessage: '.last-msg',
  lastMessageAlt: '.chat-last-msg',
  
  // Click target area
  clickArea: '.chat-item-content',
  
  // Main selector for unread candidates (optimized based on testing)
  unreadCandidates: '.geek-item',
} as const;

// Chat page selectors
export const CHAT_SELECTORS = {
  // Chat container
  chatContainer: '.chat-container',
  messageList: '.message-list',
  
  // Individual messages
  messageItem: '.message-item',
  messageContent: '.message-content',
  messageText: '.text-content',
  
  // Message sender identification
  userMessage: '.message-right',
  candidateMessage: '.message-left',
  
  // Message metadata
  messageTime: '.message-time',
  senderName: '.sender-name',
  
  // Input area
  inputBox: '.chat-input',
  inputTextarea: 'textarea.chat-input',
  sendButton: '.btn-send',
  
  // System messages
  systemMessage: '.system-msg',
} as const;

// Candidate detail selectors
export const CANDIDATE_SELECTORS = {
  // Main info section
  detailContainer: '.candidate-detail',
  infoCard: '.info-card',
  
  // Basic info
  name: '.candidate-name',
  nameAlt: '.name-text',
  position: '.position-name',
  company: '.company-name',
  salary: '.salary-text',
  
  // Requirements
  experience: '.experience-text',
  education: '.education-text',
  location: '.location-text',
  
  // Additional info
  age: '.age-text',
  status: '.status-text',
  expectedPosition: '.expect-position',
  expectedSalary: '.expect-salary',
  
  // Skills
  skillsList: '.skills-list',
  skillItem: '.skill-item',
  
  // Introduction
  introduction: '.self-introduction',
  introductionAlt: '.candidate-intro',
} as const;

// Navigation selectors
export const NAV_SELECTORS = {
  // Tab navigation
  chatTab: '.menu-chat',
  candidateTab: '.menu-recommend',
  
  // Back/return buttons
  backButton: '.icon-back',
  returnButton: '.btn-return',
  
  // Page indicators
  pageTitle: '.page-title',
  breadcrumb: '.breadcrumb',
} as const;

// Common UI elements
export const UI_SELECTORS = {
  // Loading states
  loading: '.loading',
  spinner: '.spinner',
  skeleton: '.skeleton',
  
  // Error states
  errorMessage: '.error-msg',
  emptyState: '.empty-state',
  
  // Modals/popups
  modal: '.modal-wrapper',
  modalClose: '.modal-close',
  confirm: '.btn-confirm',
  cancel: '.btn-cancel',
} as const;

// Timing constants
export const TIMING = {
  // Wait timeouts (ms)
  pageLoad: 5000,
  elementWait: 3000,
  shortWait: 1000,
  
  // Animation delays (ms)
  clickDelay: 200,
  typeDelay: 50,
  scrollDelay: 300,
  
  // Retry settings
  maxRetries: 3,
  retryDelay: 1000,
} as const;

// Zhipin URLs
export const ZHIPIN_URLS = {
  base: 'https://www.zhipin.com',
  chat: 'https://www.zhipin.com/web/boss/chat',
  recommend: 'https://www.zhipin.com/web/boss/recommend',
  login: 'https://www.zhipin.com/web/user/login',
} as const;