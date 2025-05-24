import React, { useState, useEffect } from 'react';
import { Dropbox, type DropboxAuth } from 'dropbox'; // Corrected import for DropboxAuth if needed later
import ShareLinkQrCode from './ShareLinkQrCode'; // Import the new component

export interface ConvertedImageType {
  image_name: string;
  image_data: string;
}

import { Button } from "@/components/ui/button";
import { UploadCloud } from 'lucide-react'; // Import UploadCloud icon

interface CloudUploadActionsProps {
  convertedImages: ConvertedImageType[];
}

const CloudUploadActions: React.FC<CloudUploadActionsProps> = ({ convertedImages }) => {
  const [dropboxAuth, setDropboxAuth] = useState<Dropbox | null>(null);
  const [isDropboxAuthenticated, setIsDropboxAuthenticated] = useState(false);
  const [dropboxError, setDropboxError] = useState<string | null>(null); // For auth errors primarily

  // State for Upload Progress and Errors
  const [isUploadingDropbox, setIsUploadingDropbox] = useState(false);
  const [dropboxUploadProgress, setDropboxUploadProgress] = useState<
    Record<string, { progress: number; status: 'pending' | 'uploading' | 'completed' | 'error'; error?: string; shareLink?: string }>
  >({});
  const [dropboxGlobalError, setDropboxGlobalError] = useState<string | null>(null); // For non-file-specific upload errors

  // State for Google Drive Integration
  const [isGoogleDriveAuthenticated, setIsGoogleDriveAuthenticated] = useState(false);
  const [googleDriveUser, setGoogleDriveUser] = useState<any>(null); // To store user profile info
  const [isUploadingGoogleDrive, setIsUploadingGoogleDrive] = useState(false);
  const [
    googleDriveUploadProgress,
    setGoogleDriveUploadProgress,
  ] = useState<
    Record<string, { progress: number; status: 'pending' | 'uploading' | 'completed' | 'error'; error?: string; shareLink?: string }>
  >({});
  const [googleDriveError, setGoogleDriveError] = useState<string | null>(null);

  // API Keys from Environment Variables
  const DROPBOX_APP_KEY = import.meta.env.VITE_DROPBOX_APP_KEY || "YOUR_DROPBOX_APP_KEY_HERE";
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID_HERE";
  // const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || "YOUR_GOOGLE_API_KEY_HERE"; // Not directly used in current implementation for client.init
  const IMGUR_CLIENT_ID = import.meta.env.VITE_IMGUR_CLIENT_ID || "YOUR_IMGUR_CLIENT_ID_HERE";


  // State for Imgur Integration
  const [isUploadingImgur, setIsUploadingImgur] = useState(false);
  const [
    imgurUploadProgress,
    setImgurUploadProgress,
  ] = useState<
    Record<string, { progress: number; status: 'pending' | 'uploading' | 'completed' | 'error'; error?: string; shareLink?: string }>
  >({});
  const [imgurError, setImgurError] = useState<string | null>(null);


  const redirectUri = window.location.href.split('?')[0]; // Used by Dropbox


  const handleImgurUpload = async () => {
    if (IMGUR_CLIENT_ID === "YOUR_IMGUR_CLIENT_ID_HERE") {
      setImgurError("Imgur Client ID is not configured by the developer.");
      return;
    }

    setIsUploadingImgur(true);
    setImgurError(null);
    const initialProgress = convertedImages.reduce((acc, img) => {
      acc[img.image_name] = { progress: 0, status: 'pending' };
      return acc;
    }, {} as typeof imgurUploadProgress);
    setImgurUploadProgress(initialProgress);

    for (const imageInfo of convertedImages) {
      setImgurUploadProgress((prev) => ({
        ...prev,
        [imageInfo.image_name]: { progress: 0, status: 'uploading', error: undefined, shareLink: undefined },
      }));

      try {
        const base64Data = imageInfo.image_data.split(',')[1];
        if (!base64Data) {
          throw new Error("Invalid image data format (missing base64 string).");
        }

        const formData = new FormData();
        formData.append('image', base64Data);
        formData.append('type', 'base64'); // Imgur prefers 'type' to be 'base64' if sending base64
        formData.append('name', imageInfo.image_name);
        formData.append('title', imageInfo.image_name);

        const response = await fetch('https://api.imgur.com/3/image', {
          method: 'POST',
          headers: {
            'Authorization': `Client-ID ${IMGUR_CLIENT_ID}`,
            // FormData sets the Content-Type header automatically with the correct boundary.
            // Do not set it manually when using FormData.
          },
          body: formData,
        });

        const result = await response.json();

        if (result.success) {
          setImgurUploadProgress((prev) => ({
            ...prev,
            [imageInfo.image_name]: { progress: 100, status: 'completed', shareLink: result.data.link },
          }));
        } else {
          let errorMessage = "Imgur upload failed.";
          if (typeof result.data?.error === 'string') {
            errorMessage = result.data.error;
          } else if (typeof result.data?.error?.message === 'string') {
            errorMessage = result.data.error.message;
          } else if (response.status === 429) {
            errorMessage = "Rate limit exceeded. Please try again later.";
          }
          throw new Error(errorMessage);
        }
      } catch (uploadError: any) {
        console.error(`Error uploading ${imageInfo.image_name} to Imgur:`, uploadError);
        setImgurUploadProgress((prev) => ({
          ...prev,
          [imageInfo.image_name]: { progress: 0, status: 'error', error: uploadError.message || "Unknown error" },
        }));
        // If one file fails, we could decide to stop all or continue. For now, continue.
        // If it's a rate limit error, it might be good to stop.
        if (uploadError.message.includes("Rate limit exceeded")) {
            setImgurError("Imgur API rate limit hit. Some uploads may have failed. Please try again later.");
            // Potentially stop further uploads if desired
            // setIsUploadingImgur(false);
            // return;
        }
      }
    }
    setIsUploadingImgur(false);
  };


  // --- Google Drive API Initialization and Auth ---
  useEffect(() => {
    const loadGapiClient = async () => {
      if (GOOGLE_CLIENT_ID === "YOUR_GOOGLE_CLIENT_ID_HERE") {
        console.warn("Google Client ID is a placeholder. Google Drive integration will not fully function.");
        // Optionally set an error state here to inform the user in the UI
        // setGoogleDriveError("Google Client ID is not configured by the developer.");
        // return; // Don't attempt to load gapi if key is placeholder
      }

      // Dynamically load the gapi script
      const script = document.createElement("script");
      script.src = "https://apis.google.com/js/api.js";
      script.onload = () => { // Ensure gapi is loaded before using it
        window.gapi.load('client:auth2', initializeGapiClient);
      };
      script.onerror = () => {
        setGoogleDriveError("Failed to load Google API script. Check network connection or ad blockers.");
      };
      document.body.appendChild(script);

      return () => {
        // Cleanup script if component unmounts, though gapi might already be globally loaded
        const existingScript = document.querySelector('script[src="https://apis.google.com/js/api.js"]');
        if (existingScript) {
          // document.body.removeChild(existingScript); // Be cautious with removing scripts gapi might rely on internally
        }
      };
    };

    loadGapiClient();
  }, []); // Run once on component mount

  const initializeGapiClient = async () => {
    try {
      if (GOOGLE_CLIENT_ID === "YOUR_GOOGLE_CLIENT_ID_HERE") {
         // Do not proceed with gapi.client.init if Client ID is placeholder
        setGoogleDriveError("Google Integration disabled: Client ID not configured by developer.");
        return;
      }
      await window.gapi.client.init({
        clientId: GOOGLE_CLIENT_ID,
        scope: 'https_://www.googleapis.com/auth/drive.file',
        // discoveryDocs: ['https_://www.googleapis.com/discovery/v1/apis/drive/v3/rest'], // Optional for REST API calls if not using client.drive
      });

      // Listen for sign-in state changes.
      window.gapi.auth2.getAuthInstance().isSignedIn.listen(updateGoogleSigninStatus);

      // Handle the initial sign-in state.
      updateGoogleSigninStatus(window.gapi.auth2.getAuthInstance().isSignedIn.get());
    } catch (error: any) {
      console.error("Error initializing Google API client:", error);
      setGoogleDriveError(`Error initializing Google API: ${error.details || error.message || 'Unknown error'}`);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      if (!window.gapi || !window.gapi.auth2 || !window.gapi.auth2.getAuthInstance()) {
        setGoogleDriveError("Google API not loaded yet. Please wait a moment and try again.");
        // Optionally, try to re-initialize or prompt user to refresh.
        if (!window.gapi) console.error("gapi is not loaded.");
        else if (!window.gapi.auth2) console.error("gapi.auth2 is not loaded.");
        else if (!window.gapi.auth2.getAuthInstance()) console.error("gapi.auth2.getAuthInstance() is null.");
        return;
      }
      await window.gapi.auth2.getAuthInstance().signIn();
      // The updateGoogleSigninStatus listener will handle the rest.
    } catch (error: any) {
      console.error("Error signing into Google:", error);
      setGoogleDriveError(`Error signing into Google: ${error.details || error.message || 'Unknown error'}`);
    }
  };

  const handleGoogleSignOut = async () => {
    try {
      if (!window.gapi || !window.gapi.auth2 || !window.gapi.auth2.getAuthInstance()) {
        setGoogleDriveError("Google API not loaded yet.");
        return;
      }
      await window.gapi.auth2.getAuthInstance().signOut();
      // The updateGoogleSigninStatus listener will handle setting user to null and isAuthenticated to false.
      // No need to manually setGoogleDriveUser(null) here as listener does it.
    } catch (error: any) {
      console.error("Error signing out of Google:", error);
      setGoogleDriveError(`Error signing out of Google: ${error.details || error.message || 'Unknown error'}`);
    }
  };

  const updateGoogleSigninStatus = (isSignedIn: boolean) => {
    setIsGoogleDriveAuthenticated(isSignedIn);
    if (isSignedIn) {
      const profile = window.gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile();
      setGoogleDriveUser({
        name: profile.getName(),
        email: profile.getEmail(),
        imageUrl: profile.getImageUrl(),
      });
      setGoogleDriveError(null); // Clear errors on successful sign-in
    } else {
      setGoogleDriveUser(null);
      // Don't clear googleDriveError here, as sign-out might be due to an error elsewhere
    }
  };


  // Helper to convert base64 to Blob
  const base64ToBlob = async (base64: string, type = 'application/octet-stream'): Promise<Blob> => {
    const fetchRes = await fetch(base64);
    return fetchRes.blob();
  };

  const handleGoogleDriveUpload = async () => {
    if (!isGoogleDriveAuthenticated || !window.gapi?.client?.drive) {
      setGoogleDriveError("Not authenticated with Google Drive or Drive API not loaded.");
      return;
    }

    setIsUploadingGoogleDrive(true);
    setGoogleDriveError(null);
    const initialProgress = convertedImages.reduce((acc, img) => {
      acc[img.image_name] = { progress: 0, status: 'pending' };
      return acc;
    }, {} as typeof googleDriveUploadProgress);
    setGoogleDriveUploadProgress(initialProgress);

    const appFolderName = "ImageOptimizerApp_Uploads";
    let appFolderId: string | null = null;

    // 1. Find or Create App Folder
    try {
      const folderQuery = `mimeType='application/vnd.google-apps.folder' and name='${appFolderName}' and trashed=false`;
      const folderSearchResponse = await window.gapi.client.drive.files.list({
        q: folderQuery,
        fields: 'files(id, name)',
        spaces: 'drive',
      });

      if (folderSearchResponse.result.files && folderSearchResponse.result.files.length > 0) {
        appFolderId = folderSearchResponse.result.files[0].id!;
      } else {
        const fileMetadata = {
          name: appFolderName,
          mimeType: 'application/vnd.google-apps.folder',
        };
        const folderCreateResponse = await window.gapi.client.drive.files.create({
          resource: fileMetadata,
          fields: 'id',
        });
        appFolderId = folderCreateResponse.result.id!;
      }
    } catch (error: any) {
      console.error("Error finding/creating Google Drive folder:", error);
      setGoogleDriveError(`Failed to access/create app folder: ${error.message || 'Unknown error'}`);
      setIsUploadingGoogleDrive(false);
      return;
    }

    if (!appFolderId) {
      setGoogleDriveError("Could not obtain an app folder ID for uploads.");
      setIsUploadingGoogleDrive(false);
      return;
    }

    // 2. Upload files
    for (const imageInfo of convertedImages) {
      setGoogleDriveUploadProgress((prev) => ({
        ...prev,
        [imageInfo.image_name]: { progress: 0, status: 'uploading', error: undefined, shareLink: undefined },
      }));

      try {
        const blob = await base64ToBlob(imageInfo.image_data, imageInfo.image_data.substring(5, imageInfo.image_data.indexOf(';')));
        
        const metadata = {
          name: imageInfo.image_name,
          parents: [appFolderId], 
          mimeType: blob.type,
        };

        const formData = new FormData();
        formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        formData.append('file', blob);
        
        // Using gapi.client.request for multipart upload
        // Note: This is a more manual way. For very large files, resumable uploads are better.
        const boundary = '-------314159265358979323846'; // Unique boundary
        let body = '';
        body += `--${boundary}\r\n`;
        body += `Content-Type: application/json; charset=UTF-8\r\n\r\n`;
        body += `${JSON.stringify(metadata)}\r\n`;
        body += `--${boundary}\r\n`;
        body += `Content-Type: ${blob.type || 'application/octet-stream'}\r\n\r\n`;
        // The body for gapi.client.request needs to be a string if not using specific methods.
        // For binary, it's tricky. Let's try with fetch API for upload part for more control.
        // However, gapi.client.request is preferred for auto-handling auth.
        
        // Reverting to a simpler (but potentially less robust for large files) gapi.client.drive.files.create
        // if direct body construction for gapi.client.request becomes too complex for this context.
        // The gapi.client.drive.files.create with 'media' might be simpler if metadata and media can be passed.
        // For simplicity, let's assume a method that handles this, or use fetch with Authorization header.

        // Simpler approach: Use gapi.client.request with /upload path, which handles FormData correctly.
        const uploadResponse = await window.gapi.client.request({
          path: '/upload/drive/v3/files',
          method: 'POST',
          params: { uploadType: 'multipart' },
          // No explicit 'Content-Type' header here for FormData, browser sets it with boundary
          body: formData, 
        });
        
        const fileId = uploadResponse.result.id;
        let shareLink: string | undefined = undefined;

        if (fileId) {
          // Make file publicly readable
          await window.gapi.client.drive.permissions.create({
            fileId: fileId,
            resource: { role: 'reader', type: 'anyone' },
          });
          // Get webViewLink
          const linkResponse = await window.gapi.client.drive.files.get({
            fileId: fileId,
            fields: 'webViewLink',
          });
          shareLink = linkResponse.result.webViewLink;
        }

        setGoogleDriveUploadProgress((prev) => ({
          ...prev,
          [imageInfo.image_name]: { progress: 100, status: 'completed', shareLink },
        }));

      } catch (uploadError: any) {
        console.error(`Error uploading ${imageInfo.image_name} to Google Drive:`, uploadError);
        let errorMessage = "Upload failed.";
        if (uploadError?.result?.error?.message) {
          errorMessage = uploadError.result.error.message;
        } else if (uploadError?.message) {
          errorMessage = uploadError.message;
        }

        setGoogleDriveUploadProgress((prev) => ({
          ...prev,
          [imageInfo.image_name]: { progress: 0, status: 'error', error: errorMessage },
        }));
        if (uploadError?.status === 401 || uploadError?.result?.error?.code === 401) {
          setGoogleDriveError("Google Drive authentication error. Please sign in again.");
          setIsGoogleDriveAuthenticated(false);
          setGoogleDriveUser(null);
          setIsUploadingGoogleDrive(false);
          return; 
        }
      }
    }
    setIsUploadingGoogleDrive(false);
  };


  const handleDropboxUpload = async () => {
    if (!dropboxAuth || !isDropboxAuthenticated) {
      setDropboxGlobalError("Not authenticated with Dropbox.");
      return;
    }

    setIsUploadingDropbox(true);
    setDropboxGlobalError(null);
    const initialProgress = convertedImages.reduce((acc, img) => {
      acc[img.image_name] = { progress: 0, status: 'pending' };
      return acc;
    }, {} as typeof dropboxUploadProgress);
    setDropboxUploadProgress(initialProgress);

    const appFolder = "/ImageOptimizerApp"; // Define a root folder for the app

    try {
      // Check if appFolder exists, create if not.
      // This is a simplified check. A more robust way involves listing contents of root or specific check.
      // For now, we'll proceed assuming we can create files directly or the folder if needed by path.
      // Some Dropbox API calls might auto-create parent folders if specified in path.

      for (const imageInfo of convertedImages) {
        setDropboxUploadProgress((prev) => ({
          ...prev,
          [imageInfo.image_name]: { progress: 0, status: 'uploading' },
        }));

        try {
          const blob = await base64ToBlob(imageInfo.image_data);
          const filePath = `${appFolder}/${imageInfo.image_name}`;

          // filesUploadSessionStart for larger files might be better for progress,
          // but filesUpload handles files up to 150MB directly.
          const response = await dropboxAuth.filesUpload({
            path: filePath,
            contents: blob,
            // mode: 'add', // 'add', 'overwrite', 'update'
            // autorename: true, // if you want Dropbox to handle name conflicts
            // mute: false, // true to prevent notifications to user
          });
          
          // If upload is successful, try to create a shareable link
          let shareLink: string | undefined = undefined;
          try {
            const linkResponse = await dropboxAuth.sharingCreateSharedLinkWithSettings({
              path: response.result.path_display || filePath,
              // settings: { requested_visibility: { '.tag': 'public' } } // Example: make link public
            });
            shareLink = linkResponse.result.url;
          } catch (shareError: any) {
            console.warn(`Could not create share link for ${imageInfo.image_name}:`, shareError);
            // Non-fatal, so we don't mark the upload itself as an error for this.
          }

          setDropboxUploadProgress((prev) => ({
            ...prev,
            [imageInfo.image_name]: { progress: 100, status: 'completed', shareLink },
          }));

        } catch (uploadError: any) {
          console.error(`Error uploading ${imageInfo.image_name} to Dropbox:`, uploadError);
          let errorMessage = "Upload failed.";
          if (uploadError?.error?.error_summary) {
             errorMessage = uploadError.error.error_summary;
          } else if (uploadError?.message) {
            errorMessage = uploadError.message;
          }
          
          setDropboxUploadProgress((prev) => ({
            ...prev,
            [imageInfo.image_name]: { progress: 0, status: 'error', error: errorMessage },
          }));
          // Decide if this error should be a global error (e.g. auth revoked)
          if (uploadError?.status === 401) { // Unauthorized
             setDropboxGlobalError("Dropbox authentication error. Please reconnect.");
             setIsDropboxAuthenticated(false); // Reset auth state
             setIsUploadingDropbox(false); // Stop further uploads
             return; // Exit upload process
          }
        }
      }
    } catch (globalCatchError: any) {
        // This catches errors outside the loop, e.g., if the initial folder creation failed (if implemented)
        console.error("Global error during Dropbox upload process:", globalCatchError);
        setDropboxGlobalError(`An unexpected error occurred: ${globalCatchError.message || 'Unknown error'}`);
    }

    setIsUploadingDropbox(false);
  };


  useEffect(() => {
    const authenticateWithCode = async (code: string) => {
      if (!DROPBOX_APP_KEY || DROPBOX_APP_KEY === "YOUR_DROPBOX_APP_KEY_HERE") {
        setDropboxError("Dropbox App Key is not configured for handling redirect.");
        return;
      }
      try {
        const dbx = new Dropbox({ clientId: DROPBOX_APP_KEY });
        // Note: dropbox-sdk-js types might expect specific structure for response.
        // Casting to 'any' for now to simplify if type issues arise with getAccessTokenFromCode response.
        const tokenResponse: any = await dbx.auth.getAccessTokenFromCode(redirectUri, code);
        
        // In a real app, securely store tokenResponse.result.access_token and refresh_token
        // For this example, just setting it for the current session
        dbx.auth.setAccessToken(tokenResponse.result.access_token);
        if (tokenResponse.result.refresh_token) {
          dbx.auth.setRefreshToken(tokenResponse.result.refresh_token);
        }
        
        setDropboxAuth(dbx);
        setIsDropboxAuthenticated(true);
        setDropboxError(null);

        // Clean URL
        window.history.replaceState({}, document.title, redirectUri);
      } catch (error: any) {
        console.error("Error getting Dropbox token:", error);
        setDropboxError(`Error authenticating with Dropbox: ${error.message || 'Unknown error'}`);
        setIsDropboxAuthenticated(false);
      }
    };

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code && !isDropboxAuthenticated && !dropboxAuth) { // Check if not already authenticated
      authenticateWithCode(code);
    }
  }, [redirectUri, isDropboxAuthenticated, dropboxAuth]); // Added dependencies

  const handleDropboxAuth = async () => {
    setDropboxError(null);
    if (!DROPBOX_APP_KEY || DROPBOX_APP_KEY === "YOUR_DROPBOX_APP_KEY_HERE") {
      setDropboxError("Dropbox App Key is not configured. Please set it in the code or environment variables.");
      return;
    }

    const dbx = new Dropbox({ clientId: DROPBOX_APP_KEY });
    try {
      const authUrl = await dbx.auth.getAuthenticationUrl(
        redirectUri,
        undefined, // state
        'code',    // authType
        'offline', // tokenAccessType
        undefined, // scope
        undefined, // includeGrantedScopes
        true       // usePKCE
      );
      window.location.href = authUrl.toString();
    } catch (error: any) {
      console.error("Error getting Dropbox auth URL:", error);
      setDropboxError(`Error preparing Dropbox auth: ${error.message || 'Unknown error'}`);
    }
  };


  if (convertedImages.length === 0) {
    return null;
  }

  return (
    <div className="bg-card text-card-foreground p-6 rounded-lg shadow-lg space-y-4 mt-8">
      <h2 className="text-2xl font-semibold text-center border-b border-border pb-3 mb-4">
        4. Share & Upload
      </h2>
      
      {/* Dropbox Section */}
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Dropbox</h3>
        {!isDropboxAuthenticated ? (
          <Button onClick={handleDropboxAuth} disabled={DROPBOX_APP_KEY === "YOUR_DROPBOX_APP_KEY_HERE"}>
            <UploadCloud className="mr-2 h-4 w-4" /> Connect to Dropbox
          </Button>
        ) : (
          <div className="space-y-2">
            <p className="text-green-600">Connected to Dropbox.</p>
            <Button 
              onClick={handleDropboxUpload} 
              disabled={isUploadingDropbox || convertedImages.length === 0}
            >
              {isUploadingDropbox ? (
                <><UploadCloud className="mr-2 h-4 w-4 animate-pulse" /> Uploading...</>
              ) : (
                <><UploadCloud className="mr-2 h-4 w-4" /> Upload All to Dropbox</>
              )}
            </Button>
          </div>
        )}
        {DROPBOX_APP_KEY === "YOUR_DROPBOX_APP_KEY_HERE" && (
            <p className="text-xs text-yellow-500">Dropbox App Key not configured by developer.</p>
        )}
        {dropboxError && <p className="text-sm text-destructive">{dropboxError}</p>}
        {dropboxGlobalError && <p className="text-sm text-destructive mt-2">{dropboxGlobalError}</p>}

        {isUploadingDropbox && Object.keys(dropboxUploadProgress).length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="text-md font-semibold">Upload Progress:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {Object.entries(dropboxUploadProgress).map(([fileName, status]) => (
                <li key={fileName}>
                  {fileName}: {}
                  {status.status === 'pending' && <span className="text-muted-foreground">Pending...</span>}
                  {status.status === 'uploading' && <span className="text-blue-500">Uploading ({status.progress}%)</span>}
                  {status.status === 'completed' && (
                    <span className="text-green-600">
                      ✅ Completed
                      {status.shareLink && (
                        <>
                          <a href={status.shareLink} target="_blank" rel="noopener noreferrer" className="ml-2 text-primary hover:underline break-all">(View File)</a>
                          <ShareLinkQrCode shareLink={status.shareLink} fileName={`Dropbox_${fileName}`} />
                        </>
                        <>
                          <a href={status.shareLink} target="_blank" rel="noopener noreferrer" className="ml-2 text-primary hover:underline break-all">(View File)</a>
                          <ShareLinkQrCode shareLink={status.shareLink} fileName={`GoogleDrive_${fileName}`} />
                        </>
                      )}
                    </span>
                  )}
                  {status.status === 'error' && <span className="text-destructive">❌ Error: {status.error}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Google Drive Section */}
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Google Drive</h3>
        {!isGoogleDriveAuthenticated ? (
          <Button onClick={handleGoogleSignIn} disabled={GOOGLE_CLIENT_ID === "YOUR_GOOGLE_CLIENT_ID_HERE"}>
            <UploadCloud className="mr-2 h-4 w-4" /> Connect to Google Drive
          </Button>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              {googleDriveUser?.imageUrl && (
                <img src={googleDriveUser.imageUrl} alt="User" className="w-6 h-6 rounded-full" />
              )}
              <p className="text-sm text-muted-foreground">
                Connected as {googleDriveUser?.name || googleDriveUser?.email || 'User'}
              </p>
              <Button onClick={handleGoogleSignOut} variant="outline" size="sm">Sign Out</Button>
            </div>
            <Button
              onClick={handleGoogleDriveUpload}
              disabled={isUploadingGoogleDrive || convertedImages.length === 0}
            >
              {isUploadingGoogleDrive ? (
                <><UploadCloud className="mr-2 h-4 w-4 animate-pulse" /> Uploading to Drive...</>
              ) : (
                <><UploadCloud className="mr-2 h-4 w-4" /> Upload All to Google Drive</>
              )}
            </Button>
          </div>
        )}
        {GOOGLE_CLIENT_ID === "YOUR_GOOGLE_CLIENT_ID_HERE" && !isGoogleDriveAuthenticated && (
           <p className="text-xs text-yellow-500">Google Drive integration disabled: Client ID not configured by developer.</p>
        )}
        {googleDriveError && <p className="text-sm text-destructive">{googleDriveError}</p>}
        
        {isUploadingGoogleDrive && Object.keys(googleDriveUploadProgress).length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="text-md font-semibold">Google Drive Upload Progress:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {Object.entries(googleDriveUploadProgress).map(([fileName, status]) => (
                <li key={fileName}>
                  {fileName}: {}
                  {status.status === 'pending' && <span className="text-muted-foreground">Pending...</span>}
                  {status.status === 'uploading' && <span className="text-blue-500">Uploading ({status.progress}%)</span>}
                  {status.status === 'completed' && (
                    <span className="text-green-600">
                      ✅ Completed
                      {status.shareLink && (
                        <a href={status.shareLink} target="_blank" rel="noopener noreferrer" className="ml-2 text-primary hover:underline">(View File)</a>
                      )}
                    </span>
                  )}
                  {status.status === 'error' && <span className="text-destructive">❌ Error: {status.error}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>


      {/* Imgur Section */}
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Imgur (Anonymous Upload)</h3>
        <Button
          onClick={handleImgurUpload}
          disabled={isUploadingImgur || convertedImages.length === 0 || IMGUR_CLIENT_ID === "YOUR_IMGUR_CLIENT_ID_HERE"}
        >
          {isUploadingImgur ? (
            <><UploadCloud className="mr-2 h-4 w-4 animate-pulse" /> Uploading to Imgur...</>
          ) : (
            <><UploadCloud className="mr-2 h-4 w-4" /> Upload All to Imgur</>
          )}
        </Button>
        {IMGUR_CLIENT_ID === "YOUR_IMGUR_CLIENT_ID_HERE" && (
           <p className="text-xs text-yellow-500">Imgur integration disabled: Client ID not configured by developer.</p>
        )}
        {imgurError && <p className="text-sm text-destructive">{imgurError}</p>}

        {isUploadingImgur && Object.keys(imgurUploadProgress).length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="text-md font-semibold">Imgur Upload Progress:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {Object.entries(imgurUploadProgress).map(([fileName, status]) => (
                <li key={fileName}>
                  {fileName}: {}
                  {status.status === 'pending' && <span className="text-muted-foreground">Pending...</span>}
                  {status.status === 'uploading' && <span className="text-blue-500">Uploading ({status.progress}%)</span>}
                  {status.status === 'completed' && (
                    <span className="text-green-600">
                      ✅ Completed
                      {status.shareLink && (
                        <>
                          <a href={status.shareLink} target="_blank" rel="noopener noreferrer" className="ml-2 text-primary hover:underline break-all">(View Image)</a>
                          <ShareLinkQrCode shareLink={status.shareLink} fileName={`Imgur_${fileName}`} />
                        </>
                      )}
                    </span>
                  )}
                  {status.status === 'error' && <span className="text-destructive">❌ Error: {status.error}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default CloudUploadActions;
