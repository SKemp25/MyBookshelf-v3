# MyBookshelf App - Business Rules & Management Guide

## Overview
This document outlines the business rules, operational procedures, and management guidelines for the MyBookshelf application when it goes live. These rules ensure consistent user experience, data integrity, and effective app management.

---

## 1. USER AUTHENTICATION & ACCOUNT MANAGEMENT

### 1.1 Account Creation Rules
- **Email Validation**: All user accounts must have valid email addresses
- **Password Requirements**: Minimum 6 characters (current implementation)
- **Account Uniqueness**: One account per email address
- **Auto-Login**: New users are automatically logged in after successful signup
- **Data Storage**: User data is stored locally in browser localStorage

### 1.2 Account Security Rules
- **Password Storage**: Passwords are stored in plain text in localStorage (consider encryption for production)
- **Session Management**: Login status persists until explicit logout or browser cache clear
- **Data Privacy**: All user data remains on their device - no server-side storage
- **Account Recovery**: Password reset functionality requires email service integration

### 1.3 User Profile Management
- **Profile Completeness**: Users can update name, email, phone, location
- **Preference Persistence**: All user preferences are automatically saved to localStorage
- **Data Migration**: No migration needed as data is stored locally

---

## 2. BOOK DATA MANAGEMENT

### 2.1 Author Management Rules
- **Author Normalization**: All author names are normalized using `normalizeAuthorName()` function
- **Special Characters**: Apostrophes in names (e.g., "O'Farrell") are handled correctly
- **Author Corrections**: Built-in corrections for common misspellings (e.g., "Phillip Pullman" → "Philip Pullman")
- **Duplicate Prevention**: Authors are automatically deduplicated when added
- **Sorting**: Authors are sorted alphabetically by last name

### 2.2 Book Collection Rules
- **Source**: Books are fetched from Google Books API
- **Deduplication**: Books are deduplicated using `deduplicateBooks()` function with priority rules:
  1. **Publication Date**: Earlier publication dates preferred
  2. **Publisher Priority**: Original publishers (Faber, Vintage, Penguin, etc.) preferred over reprints
  3. **Completeness**: Books with descriptions, page counts, and thumbnails preferred
  4. **Edition Type**: Original editions preferred over special/anniversary editions
- **Filtering**: Free previews and sample chapters are automatically excluded
- **Rerelease Detection**: Books with tie-in, anniversary, or special edition indicators are filtered out

### 2.3 Book Status Management
- **Reading States**: Books can be marked as "Read", "Want to Read", "Don't Want", or "Unread"
- **Status Mutually Exclusive**: A book can only have one reading status at a time
- **Status Persistence**: All status changes are saved to localStorage
- **Analytics Tracking**: Status changes are tracked for analytics

---

## 3. SEARCH & FILTERING RULES

### 3.1 Search Functionality
- **Search Scope**: Search works across book titles and author names
- **Case Insensitive**: All searches are case-insensitive
- **Real-time**: Search results update as user types
- **Clear Function**: Search can be cleared with "Clear All" button

### 3.2 Filtering Rules
- **Author Filter**: Users can filter by specific authors
- **Language Filter**: Books are filtered by user's preferred languages
- **Genre Filter**: Books can be filtered by selected genres
- **Age Range Filter**: Books are filtered by age-appropriate content
- **Advanced Filters**: Support for date ranges, title keywords, description keywords, and reading status

### 3.3 Sorting Rules
- **Default Sort**: "Newest" (by publication date)
- **Available Sorts**: Newest, Oldest, Title A-Z, Title Z-A, Author A-Z, Author Z-A
- **Sort Persistence**: Sort preference is maintained during session

---

## 4. RECOMMENDATION SYSTEM RULES

### 4.1 Recommendation Generation
- **Based On**: User's existing authors and reading preferences
- **Age-Appropriate**: Recommendations respect user's age range settings
- **Language Filtered**: Only books in user's preferred languages
- **Exclude Read**: Books already marked as read are excluded
- **Exclude Rereleases**: Tie-in and special editions are filtered out

### 4.2 Recommendation Interaction
- **Auto-Add Author**: When a recommended book is selected, its author is automatically added to user's author list
- **Book Addition**: Selected recommendations are added to the user's book collection
- **Analytics**: Recommendation clicks are tracked
- **Scroll Behavior**: After selection, the app scrolls to show the newly added book

---

## 5. PLATFORM INTEGRATION RULES

### 5.1 Platform Configuration
- **Default Platforms**: Kindle, Audible, Books (Print), Library
- **Custom URLs**: Users can configure custom URLs for each platform
- **Template Variables**: Support for `{title}`, `{author}`, and `{query}` in custom URLs
- **Platform Detection**: Smart detection for common library platforms (Libby, OverDrive, Hoopla, WorldCat)

### 5.2 Library Platform Rules
- **Default URL**: https://libbyapp.com
- **Smart Search**: Multiple search strategies for better book discovery
- **Platform-Specific**: Different search formats for different library systems
- **Fallback**: WorldCat advanced search as fallback for unknown platforms

### 5.3 Link Generation Rules
- **URL Encoding**: All book titles and authors are properly URL-encoded
- **Search Strategies**: Multiple search formats attempted for better results
- **Error Handling**: Graceful fallback if platform URL is invalid

---

## 6. DATA PERSISTENCE & STORAGE RULES

### 6.1 Local Storage Rules
- **Primary Storage**: All data stored in browser localStorage
- **Data Keys**: 
  - `personal_bookshelf`: Main book collection data
  - `bookshelf_user_{email}`: User profile and preferences
  - `bookshelf_users`: User authentication data
  - `bookshelf_current_user`: Current logged-in user
  - `bookshelf_is_logged_in`: Login status
- **Auto-Save**: Data is automatically saved on every change
- **Data Loss**: Data is lost if user clears browser cache

### 6.2 Data Structure Rules
- **Book Objects**: Must include title, author, publishedDate, description, categories, thumbnail
- **User Objects**: Must include name, email, preferredLanguages, preferredGenres, ageRange
- **Platform Objects**: Must include name, url, enabled status

---

## 7. ANALYTICS & TRACKING RULES

### 7.1 Event Tracking
- **Tracked Events**: Login, Signup, Author Added, Book Marked Read/Want/Pass, Book Shared
- **Event Data**: Includes user ID, book details, timestamps, and relevant metadata
- **Privacy**: All tracking is anonymous and stored locally
- **Error Handling**: Analytics failures don't affect app functionality

### 7.2 Reading Analytics
- **Progress Tracking**: Reading progress calculated as read books / total books
- **Statistics**: Available for logged-in users only
- **Real-time Updates**: Statistics update as user marks books as read

---

## 8. USER INTERFACE & EXPERIENCE RULES

### 8.1 Responsive Design
- **Mobile-First**: App is optimized for mobile devices
- **Breakpoints**: Responsive design with mobile and desktop layouts
- **Touch-Friendly**: All interactive elements are touch-optimized

### 8.2 Onboarding Rules
- **First-Time Users**: Onboarding prompt appears for users with no books or authors
- **Progressive Disclosure**: Features are revealed as users interact with the app
- **Help Text**: Contextual help and descriptions provided throughout

### 8.3 Accessibility Rules
- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **Screen Reader**: Proper ARIA labels and semantic HTML
- **Color Contrast**: High contrast design for readability
- **Focus Management**: Clear focus indicators

---

## 9. ERROR HANDLING & RECOVERY RULES

### 9.1 API Error Handling
- **Google Books API**: Graceful handling of API failures
- **Network Issues**: User-friendly error messages for connectivity problems
- **Rate Limiting**: Respect API rate limits and provide appropriate feedback

### 9.2 Data Error Handling
- **Invalid Data**: Skip invalid book entries rather than crashing
- **Missing Fields**: Provide defaults for missing book data
- **Corrupted Storage**: Clear corrupted localStorage data and start fresh

### 9.3 User Error Handling
- **Invalid Input**: Validate user input and provide clear error messages
- **Duplicate Actions**: Prevent duplicate book additions
- **State Recovery**: Maintain app state during errors

---

## 10. PERFORMANCE & OPTIMIZATION RULES

### 10.1 Loading Performance
- **Lazy Loading**: Components load as needed
- **Image Optimization**: Book thumbnails are optimized for web
- **Bundle Size**: Minimize JavaScript bundle size

### 10.2 Runtime Performance
- **Efficient Filtering**: Optimized filtering algorithms
- **Memory Management**: Proper cleanup of event listeners and timers
- **Debouncing**: Search input is debounced to prevent excessive API calls

---

## 11. MAINTENANCE & UPDATES RULES

### 11.1 Regular Maintenance
- **API Monitoring**: Monitor Google Books API status and rate limits
- **User Feedback**: Collect and address user feedback regularly
- **Performance Monitoring**: Track app performance metrics

### 11.2 Update Procedures
- **Feature Updates**: Test new features thoroughly before release
- **Data Migration**: Plan for any future data migration needs
- **Backward Compatibility**: Maintain compatibility with existing user data

### 11.3 Backup & Recovery
- **Data Backup**: Encourage users to export their data regularly
- **Recovery Procedures**: Document recovery procedures for data loss
- **Version Control**: Maintain proper version control for all code changes

---

## 12. LEGAL & COMPLIANCE RULES

### 12.1 Data Privacy
- **Local Storage Only**: No user data is sent to external servers
- **User Consent**: Clear privacy policy and data usage disclosure
- **Data Ownership**: Users own their data and can export/delete it

### 12.2 Copyright & Licensing
- **Book Data**: Book information is sourced from Google Books API
- **Attribution**: Proper attribution to data sources
- **Fair Use**: Ensure compliance with fair use guidelines

### 12.3 Terms of Service
- **Usage Rights**: Define acceptable use of the application
- **Liability**: Clear liability limitations
- **Updates**: Right to update terms and conditions

---

## 13. MONITORING & ALERTING RULES

### 13.1 Key Metrics to Monitor
- **User Engagement**: Daily active users, session duration
- **Feature Usage**: Most used features, least used features
- **Error Rates**: Application errors, API failures
- **Performance**: Page load times, API response times

### 13.2 Alert Thresholds
- **High Error Rate**: Alert if error rate exceeds 5%
- **API Failures**: Alert if Google Books API is down
- **Performance Degradation**: Alert if page load times exceed 3 seconds

---

## 14. SUPPORT & TROUBLESHOOTING RULES

### 14.1 Common Issues
- **Data Loss**: Guide users through localStorage data recovery
- **Search Issues**: Troubleshoot author name normalization problems
- **Platform Links**: Help users configure custom platform URLs
- **Performance**: Guide users through browser optimization

### 14.2 Support Procedures
- **Issue Documentation**: Document common issues and solutions
- **User Communication**: Clear communication channels for support
- **Escalation**: Define escalation procedures for complex issues

---

## 15. FUTURE ENHANCEMENT RULES

### 15.1 Feature Roadmap
- **Priority Features**: Book ratings, reading progress tracking, export functionality
- **User Requests**: Prioritize features based on user feedback
- **Technical Debt**: Regular code refactoring and optimization

### 15.2 Scalability Planning
- **Database Migration**: Plan for future database integration
- **User Growth**: Prepare for increased user base
- **Feature Complexity**: Balance feature richness with performance

---

*This document should be reviewed and updated regularly as the application evolves and new requirements emerge.*
