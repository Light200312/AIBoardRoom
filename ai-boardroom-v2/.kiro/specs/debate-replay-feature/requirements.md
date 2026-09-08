# Requirements Document

## Introduction

The Debate Replay Feature adds a message-by-message playback system to the AI Boardroom application's history view (MentorDashboard). This feature enables users to watch past debates unfold sequentially with synchronized whiteboard updates, as if watching a recording. The primary use case is creating demo videos and pitch presentations that showcase how the AI council identifies and resolves business idea problems in real-time.

## Glossary

- **Replay_System**: The client-side playback mechanism that displays historical debate messages and whiteboard updates sequentially
- **MentorDashboard**: The main discussion interface component that displays council messages and member information
- **Whiteboard**: The shared board component that displays problems, questions, and solutions identified during debate
- **Replay_Controls**: UI elements (play/pause, stop, speed selector, progress indicator) that control playback
- **Dummy_Debate**: Pre-generated debate data for demonstration purposes stored client-side
- **Message_Stream**: The sequential display of agent messages and user comments during replay
- **Whiteboard_Sync**: The mechanism that triggers whiteboard updates when their associated message appears during replay
- **Replay_Mode**: The active state when a debate is being replayed, blocking user input and showing replay controls

## Requirements

### Requirement 1: Dummy Debate Data

**User Story:** As a developer setting up the replay feature, I want pre-generated dummy debate data, so that I can demonstrate the replay functionality without backend dependencies.

#### Acceptance Criteria

1. THE Replay_System SHALL store a complete dummy debate for the topic "AI-powered restaurant where robots cook all meals with personalized menus"
2. THE Dummy_Debate SHALL contain between 20 and 30 messages total
3. THE Dummy_Debate SHALL include exactly 4 core agents with IDs: brd-001 (Investor), brd-002 (Financial Analyst), brd-003 (Market Analyst), brd-004 (Technical Expert)
4. THE Dummy_Debate SHALL include 2 to 3 user interjections at strategic points in the debate flow
5. THE Dummy_Debate SHALL include 5 to 7 problems added to the whiteboard
6. THE Dummy_Debate SHALL mark 2 to 3 problems as resolved with solutions
7. THE Dummy_Debate SHALL follow a natural debate flow: introduction, problem identification, deep analysis, resolution attempts, verdict
8. THE Dummy_Debate SHALL identify clear demoable flaws: technology feasibility issues, cost problems, regulatory concerns, supply chain challenges
9. THE Dummy_Debate SHALL be stored client-side only with no backend database storage
10. THE Dummy_Debate SHALL include metadata linking each message to whiteboard actions (create, resolve, update) where applicable

### Requirement 2: Replay Controls UI

**User Story:** As a user viewing debate history, I want visible replay controls, so that I can start, control, and stop the debate playback.

#### Acceptance Criteria

1. WHEN viewing historical debate data, THE MentorDashboard SHALL display a "Replay Debate" button in the header
2. WHEN viewing a live debate, THE MentorDashboard SHALL NOT display the "Replay Debate" button
3. WHEN Replay_Mode is active, THE Replay_Controls SHALL display a Play/Pause toggle button
4. WHEN Replay_Mode is active, THE Replay_Controls SHALL display a "Stop Replay" button
5. WHEN Replay_Mode is active, THE Replay_Controls SHALL display a speed selector with options: 0.5x, 1x, 2x, 4x
6. WHEN Replay_Mode is active, THE Replay_Controls SHALL display a progress indicator showing current position (e.g., "Message 5 / 28")
7. THE Replay_Controls SHALL be positioned at the right end of the MentorDashboard header
8. THE Replay_Controls SHALL match the existing UI style using Tailwind classes with dark mode support

### Requirement 3: Replay Initialization

**User Story:** As a user, I want to click "Replay Debate" and have the view reset, so that I can watch the debate from the beginning.

#### Acceptance Criteria

1. WHEN the user clicks "Replay Debate", THE Replay_System SHALL clear all messages from the ArgumentsView display
2. WHEN the user clicks "Replay Debate", THE Replay_System SHALL reset the Whiteboard to an empty state
3. WHEN the user clicks "Replay Debate", THE Replay_System SHALL disable the message input field
4. WHEN the user clicks "Replay Debate", THE Replay_System SHALL show Replay_Controls in the header
5. WHEN the user clicks "Replay Debate", THE Replay_System SHALL hide the "Replay Debate" button
6. WHEN the user clicks "Replay Debate", THE Replay_System SHALL automatically begin playback from the first message
7. WHEN Replay_Mode is active, THE MentorDashboard SHALL display a visual indicator (colored border or "REPLAY MODE" badge)

### Requirement 4: Message Playback

**User Story:** As a user watching a replay, I want messages to appear one by one at a controlled speed, so that I can follow the debate progression naturally.

#### Acceptance Criteria

1. WHEN Replay_Mode is active and playing, THE Message_Stream SHALL display messages sequentially in chronological order
2. WHEN the speed is set to 0.5x, THE Message_Stream SHALL display one message every 2 seconds
3. WHEN the speed is set to 1x, THE Message_Stream SHALL display one message every 1 second
4. WHEN the speed is set to 2x, THE Message_Stream SHALL display one message every 0.5 seconds
5. WHEN the speed is set to 4x, THE Message_Stream SHALL display one message every 0.25 seconds
6. WHEN a new message appears, THE ArgumentsView SHALL auto-scroll to keep the latest message visible
7. WHEN the user changes playback speed during replay, THE Replay_System SHALL apply the new timing immediately to subsequent messages
8. THE Message_Stream SHALL include both agent messages and user comments in correct chronological order

### Requirement 5: Whiteboard Synchronization

**User Story:** As a user watching a replay, I want whiteboard problems to appear when mentioned in messages, so that I can see how issues are identified and tracked during debate.

#### Acceptance Criteria

1. WHEN a message with whiteboardAction "create" appears, THE Whiteboard SHALL display a new problem card
2. WHEN a message with whiteboardAction "resolve" appears, THE Whiteboard SHALL mark the specified problem as resolved
3. WHEN a message with whiteboardAction "update" appears, THE Whiteboard SHALL update the specified problem description
4. WHEN a whiteboard change occurs, THE Whiteboard SHALL highlight the affected card with a visual animation for 1 to 2 seconds
5. THE Whiteboard_Sync SHALL use the problemId field from message metadata to link messages to specific problems
6. THE Whiteboard SHALL display the highlight animation as a pulse effect or glow that is noticeable but not distracting

### Requirement 6: Playback Control

**User Story:** As a user watching a replay, I want to pause, resume, and stop playback, so that I can control the viewing experience.

#### Acceptance Criteria

1. WHEN the user clicks the pause button during playback, THE Replay_System SHALL pause message display
2. WHEN the user clicks the play button while paused, THE Replay_System SHALL resume message display from the current position
3. WHEN the user clicks "Stop Replay", THE Replay_System SHALL exit Replay_Mode
4. WHEN the user clicks "Stop Replay", THE ArgumentsView SHALL display all messages (full history view)
5. WHEN the user clicks "Stop Replay", THE Whiteboard SHALL display the final state with all problems
6. WHEN the user clicks "Stop Replay", THE Replay_System SHALL re-enable the message input field
7. WHEN the user clicks "Stop Replay", THE Replay_System SHALL hide Replay_Controls and show the "Replay Debate" button

### Requirement 7: Replay Completion

**User Story:** As a user watching a replay, I want the system to handle completion gracefully, so that I can transition back to normal viewing mode.

#### Acceptance Criteria

1. WHEN all messages have been displayed, THE Replay_System SHALL automatically stop playback
2. WHEN replay completes, THE ArgumentsView SHALL display all messages (full history view)
3. WHEN replay completes, THE Whiteboard SHALL display the final state with all problems
4. WHEN replay completes, THE Replay_System SHALL re-enable the message input field
5. WHEN replay completes, THE Replay_System SHALL hide Replay_Controls and show the "Replay Debate" button
6. WHEN replay completes, THE Replay_System SHALL remove the Replay_Mode visual indicator

### Requirement 8: Client-Side Performance

**User Story:** As a user, I want the replay feature to run smoothly, so that I can create high-quality screen recordings for demos.

#### Acceptance Criteria

1. THE Replay_System SHALL execute all playback logic client-side without backend API calls
2. THE Replay_System SHALL function offline once the page is loaded
3. THE Replay_System SHALL maintain smooth animation and scrolling performance at 4x speed
4. THE Replay_System SHALL NOT interfere with real debate functionality when Replay_Mode is not active
5. WHEN switching between speeds, THE Replay_System SHALL transition without visual glitches or stuttering

### Requirement 9: Data Structure

**User Story:** As a developer, I want well-structured dummy data, so that I can easily maintain and extend the replay feature.

#### Acceptance Criteria

1. THE Dummy_Debate SHALL be stored as a JavaScript object or JSON structure in the frontend codebase
2. EACH message in the Dummy_Debate SHALL include fields: id, text, timestamp, speakerId, speakerName, isUser
3. EACH message that triggers whiteboard changes SHALL include metadata fields: whiteboardAction ("create", "resolve", or "update"), problemId
4. THE Dummy_Debate SHALL include a separate array of whiteboard problems with fields: id, text, status, raisedBy, solution, resolvedBy
5. THE Dummy_Debate SHALL include agent metadata with fields: id, name, role, avatarInitials

### Requirement 10: Visual Design Consistency

**User Story:** As a user, I want the replay interface to match the application design, so that the feature feels integrated and professional.

#### Acceptance Criteria

1. THE Replay_Controls SHALL use Tailwind CSS classes consistent with existing UI components
2. THE Replay_Controls SHALL support both light and dark mode themes
3. THE Replay_Mode indicator SHALL be subtle and non-intrusive (colored border or small badge)
4. THE Whiteboard highlight animation SHALL be noticeable but not distracting with duration between 1 and 2 seconds
5. THE Replay_Controls buttons SHALL match the style of existing buttons in the MentorDashboard header
