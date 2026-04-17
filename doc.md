# StudyTube Documentation

This document explains how the StudyTube application works, its features, and how the data is managed. It is written to be a clear guide for anyone maintaining or using the software.

## Project Overview

StudyTube is a desktop application built to help people learn from YouTube videos more effectively. It combines video playback with AI-powered tools for vocabulary building and research note-taking. 

The application is built using Electron and React. It runs on Windows, Mac, and Linux.

## How to Start the App

To run the application in a development environment, you need to use the following command in your terminal:

npm run dev

This command starts two things: a Vite server for the frontend interface and the Electron block for the desktop window.

## Core Features

### 1. Discover (Search)
This is the entry point of the application. You can search for any YouTube video. When you select a video, it opens in the viewer where you can watch it and interact with the transcript.

### 2. Library (Vocabulary & Insights)
The library is a collection of all the words or concepts you have saved while watching videos. 
- You can categorize your findings into collections.
- You can drag and drop items between different folders.
- Each item can be expanded to see AI-generated definitions and examples.

### 3. Research Editor
This is a dedicated space for long-form note-taking. It uses a block-based system called Editor.js.
- You can add headers, lists, checklists, and code blocks.
- Every note you take is saved permanently to a local file.
- There is a clear distinction between raw notes and the structured data in your library.

### 4. Research Assist (AI Copilot)
This is a chat interface that allows you to talk to an AI (DeepSeek) about the video you are watching or the notes you are taking. It has access to the video transcript to provide accurate answers.

## Data Storage and Persistence

All your data is stored locally on your computer. It does not go to a cloud database, which keeps your research private.

The data is kept in the following location:
b:/yt-downloader/data/

The files used are:
- library.json: Stores all your saved vocabulary and research entries.
- collections.json: Stores the names of the folders you created in your library.
- notes.json: Stores the content of your Research Editor.
- app-state.json: Stores your settings, such as your AI API key and save paths.

The application uses an atomic saving method. This means it creates a temporary file before overwriting the main one, which prevents data loss if the app crashes during a save.

## Technical Structure

### Frontend (React)
The user interface is built with React.
- src/App.jsx: The main file that handles navigation between different views.
- src/components/: Contains all the UI pieces like the Sidebar, Activitybar, and EditorView.
- src/styles.css: The main styling file.
- src/editor.css: Specific styles for the Research Editor to make it look clean.

### Backend (Electron)
The backend manages the window and talks to your computer's file system.
- electron/main.js: The brain of the desktop app. it handles file saving, AI requests, and video metadata.
- electron/preload.cjs: A bridge that allows the React frontend to securely talk to the Electron backend.

### Third-Party Tools
- Editor.js: Used for the block-based editor.
- Lucide React: Used for all the icons.
- Framer Motion: Used for smooth animations and transitions.
- DeepSeek API: The AI engine that provides definitions and chat responses.

## Maintenance and Updates

The app includes an auto-updater that checks for new versions on GitHub. For developers, the build commands for different operating systems are included in the package.json file.

If you ever need to clear all data, you can delete the files in the data folder, and the app will recreate them as empty files on the next launch.
