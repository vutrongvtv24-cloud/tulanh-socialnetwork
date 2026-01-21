/**
 * English Translations
 */
export const en = {
    // App
    appName: "The Fridge",

    // Navigation
    nav: {
        community: "Community",
        myJournal: "My Journal",
        todoList: "Todo List",
        messages: "Messages",
        courses: "Courses",
    },

    // Sidebar Right
    sidebar: {
        yourProgress: "Your Progress",
        xpProgress: "XP Progress",
        xpToLevel: "{xp} XP to Level {level}",
        maxLevel: "🏆 Max level reached!",
        dailyCheckin: "Daily Check-in (+3 XP)",
        alreadyCheckedIn: "✓ Checked in today",
        imageLimit: "Image limit: {description}",
        leaderboard: "Leaderboard",
    },

    // Feed / Posts
    feed: {
        whatsOnYourMind: "What's on your mind?",
        shareWhatYouLearned: "Share what you've learned...",
        post: "Post",
        like: "Like",
        comment: "Comment",
        share: "Share",
        writeComment: "Write a comment...",
        postComment: "Post",
        showAllComments: "Show all comments",
        noPostsYet: "No posts yet",
        delete: "Delete",
        edit: "Edit",
    },

    // Profile
    profile: {
        memberSince: "Member since",
        followers: "Followers",
        following: "Following",
        follow: "Follow",
        unfollow: "Unfollow",
        message: "Message",
        posts: "Posts",
        about: "About",
        stats: "Stats",
        totalPosts: "Total Posts",
        bio: "Bio",
        noBioAdded: "No bio added",
        editProfile: "Edit Profile",
        changeName: "Change Name",
        changeAvatar: "Change Avatar",
        settings: "Settings",
        language: "Language",
        levelTip: "💡 Tip: Level up to unlock more great posts, tricks and exclusive courses!",
    },

    // Community
    community: {
        joinCommunity: "Join Community",
        leaveCommunity: "Leave Community",
        pendingApproval: "Pending Approval",
        members: "Members",
        pendingPosts: "Pending Posts",
        approve: "Approve",
        reject: "Reject",
        requiredLevel: "Required Level: {level}",
        levelRequired: "Level {level} required to view this content",
    },

    // Auth
    auth: {
        signInWithGoogle: "Sign in with Google",
        signOut: "Sign out",
        welcomeBack: "Welcome back!",
        guest: "Guest",
        selectLanguage: "Select your language",
        welcome: "Welcome Builder",
        description: "Join the ecosystem to connect, share your work, and level up with the community.",
        onlyGoogle: "Only Google Login Supported",
        agreement: "By continuing, you acknowledge that you have read and agree to our Code of Conduct.",
    },

    // Messages
    messages: {
        title: "Messages",
        newConversation: "New conversation",
        typeMessage: "Type a message...",
        send: "Send",
        noMessages: "No messages yet",
    },

    // Todo
    todo: {
        addTask: "Add a new task...",
        addButton: "Add",
        noTasks: "No tasks yet",
        complete: "Complete",
        delete: "Delete",
    },

    // Journal
    journal: {
        myJournal: "My Journal",
        newEntry: "New Entry",
        title: "Title",
        content: "Content",
        save: "Save",
        cancel: "Cancel",
    },

    // Notifications / Toast
    toast: {
        postCreated: "Post created successfully!",
        postDeleted: "Post deleted",
        commentAdded: "Comment added",
        checkinSuccess: "Check-in successful! +3 XP",
        levelUp: "Level Up!",
        error: "Error",
        loading: "Loading...",
    },

    // Errors
    errors: {
        userNotFound: "User not found",
        noPostsYet: "No posts yet",
        somethingWentWrong: "Something went wrong",
        imageLimitReached: "Image post limit reached",
    },

    // Common
    common: {
        save: "Save",
        cancel: "Cancel",
        delete: "Delete",
        edit: "Edit",
        close: "Close",
        confirm: "Confirm",
        loading: "Loading...",
    },
};

export type TranslationKeys = typeof en;
