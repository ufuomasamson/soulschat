**# Dating Chat App — Product \& UI Design Specification**



\## 1. Product Vision



Build a modern social dating/chat application that feels immediately familiar to users of WhatsApp.



The application should prioritize:



1\. Messaging

2\. Friend connections

3\. Discovering new people

4\. Simple profiles

5\. Privacy and safety



The app should NOT feel like a complicated traditional dating website.



The experience should feel like:



"WhatsApp simplicity + social discovery + dating"



The user should be able to open the application and understand how to use it within seconds.



\---



\# 2. Core Navigation



The application has four primary bottom-navigation destinations:



1\. Chats

2\. Friends

3\. Feed

4\. Settings



Bottom navigation should remain visible throughout the authenticated application except when viewing a full-screen conversation or other focused experience.



Navigation:



\[ Chat ] \[ Friends ] \[ Feed ] \[ Settings ]



Use simple line icons with a clean modern appearance.



The currently selected tab uses the primary red brand color.



\---



\# 3. Brand Personality



The application should feel:



\- Friendly

\- Warm

\- Modern

\- Simple

\- Social

\- Trustworthy

\- Conversational

\- Slightly romantic



Avoid:



\- Excessive gradients

\- Excessive animations

\- Overly complicated dating-card interfaces

\- Excessive hearts

\- Casino-like UI

\- Neon colors

\- Excessive glassmorphism

\- Heavy shadows



The design should feel mature and premium.



\---



\# 4. Color System



Primary brand color:



\#B4232C



Dark primary:



\#7F1721



Light primary:



\#FDF2F3



Background:



\#FFFFFF



Secondary background:



\#F7F7F8



Chat background:



\#F4F4F5



Primary text:



\#171717



Secondary text:



\#737373



Muted text:



\#A3A3A3



Border:



\#E5E5E5



Success / online:



\#22C55E



Error:



\#EF4444



The red color should be used carefully.



Use it primarily for:



\- Active navigation

\- Primary buttons

\- Unread indicators

\- Important actions

\- Friend request actions

\- Small brand accents



Do NOT make the entire interface red.



\---



\# 5. Typography



Use a modern sans-serif font.



Preferred:



Inter



Fallback:



system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif



Typography should be clean and highly readable.



Screen titles:



20–24px



Section titles:



16–18px



Body:



14–16px



Secondary text:



12–14px



Chat messages:



15–16px



\---



\# 6. General UI Principles



Use:



\- Rounded corners

\- Large touch targets

\- Clean spacing

\- Minimal borders

\- Subtle shadows

\- Smooth transitions

\- Responsive layouts

\- Mobile-first design



Do not make buttons unnecessarily large.



Cards should generally use:



border-radius: 14–18px



Inputs:



border-radius: 12–16px



Avatars:



border-radius: 50%



\---



\# 7. AUTHENTICATION



\## Login Screen



The login screen should be extremely simple.



Top:



Brand logo



Headline:



"Welcome back"



Subtitle:



"Connect with people and start a conversation."



Fields:



Phone number or email



Password



Primary button:



"Log in"



Secondary:



"Forgot password?"



Bottom:



"Don't have an account? Sign up"



\---



\# 8. SIGN UP



Signup should collect only essential information.



Step 1:



Name



Step 2:



Date of birth



Step 3:



Gender



Step 4:



Profile photo



Step 5:



Short bio



Step 6:



Location



Step 7:



Interests



Do not overwhelm users with a huge registration form.



\---



\# 9. PROFILE CREATION



Profile should contain:



Profile photo



Name



Age



Location



Bio



Interests



Optional:



Occupation



Education



Relationship intention



Example:



Sarah, 24



Lagos, Nigeria



"Love music, movies, good conversations and meeting interesting people."



Interests:



Music

Movies

Travel

Food



\---



\# 10. CHATS SCREEN



This is the primary home screen.



Header:



"Chats"



Top-right:



Search icon



Optional:



New chat icon



Below header:



Search conversations field



Placeholder:



"Search chats"



Conversation list:



\--------------------------------



\[Avatar] Sarah



&#x20;         Hey, how are you?



&#x20;                         10:42 PM



\--------------------------------



\[Avatar] David



&#x20;         That sounds great 😂



&#x20;                         9:21 PM



\--------------------------------



\[Avatar] Grace



&#x20;         See you tomorrow



&#x20;                         Yesterday



\--------------------------------



Each conversation item should contain:



\- Avatar

\- Online indicator when appropriate

\- Name

\- Last message

\- Timestamp

\- Unread count



Unread conversation:



Name should be slightly bolder.



Unread badge:



Red circular badge with white number.



\---



\# 11. CHAT SCREEN



The chat screen is one of the most important parts of the application.



It should feel extremely smooth and familiar to WhatsApp users without copying WhatsApp branding.



Header:



Back



Avatar



Name



Online status



Optional voice/video icons



Example:



← \[Avatar] Sarah

&#x20;            online



Chat area:



Use subtle neutral background.



Messages should use rounded bubbles.



Incoming message:



Light gray/white bubble.



Outgoing message:



Light red / brand-tinted bubble.



Outgoing messages should have:



Message



Time



Read status



Example:



"Hey! How was your day?"



10:42 PM ✓✓



Message input at bottom:



\[ + ] \[ Type a message... ] \[ 🎤 ]



When typing:



\[ + ] \[ Hello Sarah... ] \[ ➤ ]



The send button should replace the microphone when text exists.



\---



\# 12. CHAT FEATURES



Implement:



\- Real-time messages

\- Typing indicator

\- Online status

\- Last seen

\- Sent status

\- Delivered status

\- Read status

\- Message timestamps

\- Emoji

\- Image messages

\- Reply

\- Delete

\- Copy

\- Block

\- Report



Do not implement complicated features until the core chat experience is extremely smooth.



Priority:



REAL-TIME CHAT > everything else.



\---



\# 13. TYPING INDICATOR



When another user is typing:



Sarah



typing...



Use a subtle animated three-dot indicator.



Example:



● ● ●



Animation should be smooth and subtle.



\---



\# 14. FRIENDS SCREEN



Header:



"Friends"



Tabs:



All

Online

Requests



Example:



Friends



\[All] \[Online] \[Requests]



Friend list:



\[Avatar]



Sarah

Online



\[Message]



\--------------------------------



David

Last seen recently



\[Message]



Friend requests should appear under Requests.



Example:



Sarah wants to be your friend.



\[Accept] \[Decline]



\---



\# 15. FEED / DISCOVERY SCREEN



This is where users discover new people.



Header:



"Discover"



Subtitle:



"Meet new people and make new connections."



Search:



"Search people"



Optional filters:



Age

Location

Interests



Then display user discovery cards.



Example:



\--------------------------------

|                              |

|         PROFILE PHOTO        |

|                              |

\--------------------------------



Sarah, 24



📍 Lagos



"Music lover. Food explorer.

Always up for a good conversation."



Music • Travel • Movies



\[ Add Friend ]



\[ View Profile ]



Users should be able to scroll vertically through profiles.



Do NOT use the Tinder-style swipe interface as the primary interaction.



The product should feel more like a social feed.



\---



\# 16. FEED PROFILE CARD



Profile card structure:



Large profile image



Name + age



Verification indicator if applicable



Location



Short bio



Interests



Primary CTA:



"Add Friend"



Secondary CTA:



"View Profile"



Optional:



"Not interested"



Users should be able to dismiss profiles without creating unnecessary friction.



\---



\# 17. USER PROFILE



Profile screen:



Large profile image



Name



Age



Location



Online status



Bio



Interests



Additional photos



Relationship intention if the user chooses to display it.



Actions:



Add Friend



Message



Block



Report



If already friends:



"Message"



\---



\# 18. SETTINGS



Header:



"Settings"



Profile section:



\[Avatar]



Name



Edit Profile



Then:



Account



Privacy



Notifications



Blocked Users



Security



Help \& Support



Terms



Privacy Policy



Logout



Example:



Settings



\-------------------------



Profile



\[Avatar]

Sarah

Edit Profile



\-------------------------



Account

Privacy

Notifications

Security



\-------------------------



Safety

Blocked Users

Report a Problem



\-------------------------



About

Terms of Service

Privacy Policy



\-------------------------



Log Out



\---



\# 19. EDIT PROFILE



Allow users to change:



Profile photo



Name



Bio



Location



Gender



Interests



Relationship intention



Additional photos



Keep editing simple.



\---



\# 20. NOTIFICATIONS



Notifications should include:



New friend request



Friend request accepted



New message



Someone interacted with profile



System notifications



Example:



Sarah sent you a friend request.



2m



David accepted your friend request.



1h



\---



\# 21. EMPTY STATES



Every major screen must have a useful empty state.



Chats:



"No conversations yet"



"Start meeting people and your conversations will appear here."



Button:



"Discover People"



Friends:



"No friends yet"



"Discover people and start making new connections."



Button:



"Discover People"



Feed:



"No new people right now"



"Check back later for new people to discover."



\---



\# 22. LOADING STATES



Use skeleton loading instead of large loading spinners whenever possible.



For chat list:



Avatar skeleton



Name skeleton



Message skeleton



Timestamp skeleton



For Feed:



Profile image skeleton



Text skeleton



Button skeleton



\---



\# 23. RESPONSIVE DESIGN



Mobile is the primary experience.



Desktop should still be supported.



Mobile:



Bottom navigation visible.



Desktop:



Use a centered application layout.



Recommended desktop structure:



\--------------------------------------------------

|              App Container                     |

|                                                |

| Sidebar | Main Content | Optional Details      |

|                                                |

\--------------------------------------------------



However, do NOT turn the application into a complicated enterprise dashboard.



It must still feel like a messaging application.



\---



\# 24. DESKTOP CHAT LAYOUT



Desktop:



Left:



Conversation list



Center:



Active conversation



Optional right panel:



User information



Example:



\----------------------------------------------------

| Chats       | Sarah                              |

|             |                                    |

| Sarah       | Hey!                               |

| David       |                    Hello!          |

| Grace       |                                    |

|             |                    How are you?    |

|             |                                    |

|             | \[ Type a message... ]             |

\----------------------------------------------------



\---



\# 25. MOBILE BOTTOM NAVIGATION



Fixed bottom navigation.



Four items:



Chat

Friends

Feed

Settings



Example:



\-----------------------------------------

💬        👥        ❤️        ⚙

Chat    Friends    Feed     Settings

\-----------------------------------------



Selected icon and label use the brand red.



Navigation should have a clean white background and subtle top border/shadow.



\---



\# 26. MICRO INTERACTIONS



Animations should be subtle.



Use:



\- Message appearing animation

\- Friend request success animation

\- Button press feedback

\- Typing indicator

\- Online status transitions

\- Page transitions

\- Skeleton loading

\- Image loading transitions



Avoid:



\- Large bouncing animations

\- Excessive confetti

\- Slow page transitions



The application should feel FAST.



\---



\# 27. PERFORMANCE



The chat experience must feel instantaneous.



Use:



\- Optimistic UI for sending messages

\- WebSocket/realtime messaging

\- Pagination

\- Lazy-loaded images

\- Image compression

\- Virtualized message lists where appropriate

\- Debounced search

\- Cached conversation data



Messages should appear immediately in the UI while the backend confirms delivery.



\---



\# 28. REAL-TIME CHAT ARCHITECTURE



Messages need:



id

conversation\_id

sender\_id

receiver\_id

content

message\_type

created\_at

delivered\_at

read\_at

reply\_to

deleted\_at



Conversation:



id

created\_at

updated\_at



Conversation members:



conversation\_id

user\_id



Users:



id

name

email

phone

avatar

bio

location

date\_of\_birth

gender

online\_status

last\_seen

created\_at



Friends:



id

sender\_id

receiver\_id

status

created\_at



Friend status:



pending

accepted

declined

blocked



\---



\# 29. SAFETY



Because this is a social/dating application, safety must be built into the product.



Users should be able to:



\- Block users

\- Report users

\- Remove friends

\- Control profile visibility

\- Control who can send friend requests

\- Control online status

\- Control last-seen visibility



Report options:



Spam

Harassment

Fake profile

Inappropriate behavior

Other



Never expose private user information unnecessarily.



\---



\# 30. AGE SAFETY



The application must have appropriate age restrictions and safeguards.



Do not allow minors to be matched with adults for dating.



The system should validate age during registration and enforce the platform's minimum age requirement.



\---



\# 31. ACCESSIBILITY



Use:



\- Adequate contrast

\- Large touch targets

\- Keyboard accessibility

\- Screen-reader labels

\- Visible focus states

\- Proper semantic HTML



Do not rely solely on color to communicate status.



\---



\# 32. COMPONENT SYSTEM



Create reusable components.



Components:



Button

IconButton

Avatar

Badge

Input

SearchInput

BottomNavigation

TopBar

ChatListItem

MessageBubble

TypingIndicator

ProfileCard

FriendRequestCard

ProfileHeader

SettingsItem

Modal

Sheet

Toast

Skeleton

EmptyState



Do not duplicate UI code.



\---



\# 33. IMPORTANT UX RULE



The application should always prioritize the user's current task.



If the user is chatting:



Do not interrupt them with unnecessary popups.



If the user is discovering people:



Do not constantly show chat notifications.



If the user is editing settings:



Do not automatically navigate elsewhere.



Keep the application calm and predictable.



\---



\# 34. BRAND FEEL



The final interface should make the user think:



"This feels familiar."



"It is very easy to use."



"I know where everything is."



"It feels like WhatsApp, but this is for meeting people."



That feeling is more important than adding lots of features.



\---



\# 35. DEVELOPMENT PRIORITY



Build in this order:



PHASE 1

Authentication



PHASE 2

User profiles



PHASE 3

Bottom navigation



PHASE 4

Chats UI



PHASE 5

Real-time messaging



PHASE 6

Friends



PHASE 7

Discovery Feed



PHASE 8

Settings



PHASE 9

Notifications



PHASE 10

Safety / blocking / reporting



PHASE 11

Performance optimization



PHASE 12

Final polish



Do not attempt to build every feature simultaneously.



\---



\# 36. CURSOR IMPLEMENTATION RULES



Before writing code:



1\. Inspect the existing project.

2\. Determine the current framework.

3\. Determine the current database/backend.

4\. Do not replace the existing stack unless explicitly instructed.

5\. Reuse existing components where appropriate.

6\. Create a consistent design system.

7\. Build mobile-first.

8\. Make every page responsive.

9\. Avoid placeholder-looking UI.

10\. Do not create unnecessary features.



When implementing a screen:



1\. Build the layout.

2\. Build reusable components.

3\. Add responsive behavior.

4\. Add loading states.

5\. Add empty states.

6\. Add error states.

7\. Connect real data.

8\. Test interactions.

9\. Polish animations.

10\. Verify mobile and desktop layouts.



Never generate a visually inconsistent page.



Every new page must follow this Design.md.



\---



\# 37. FINAL PRODUCT EXPERIENCE



The final application should feel like:



WhatsApp

\+

Social discovery

\+

Friend requests

\+

Dating



But the UI should remain extremely simple.



The primary loop is:



Discover → Add Friend → Become Friends → Chat → Build Connection



The chat experience is the heart of the application.

