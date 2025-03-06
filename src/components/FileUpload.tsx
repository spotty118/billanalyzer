import React, { useState } from 'react';

    const FileUpload = () => {
      const [selectedFile, setSelectedFile] = useState<File | null>(null);

      const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && (file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'application/pdf')) {
          setSelectedFile(file);
          console.log("File selected:", file.name); // Basic feedback for now
        } else {
          alert("Please select a valid image (PNG, JPEG) or PDF file.");
          setSelectedFile(null);
        }
      };

      return (
        <div>
          <input type="file" accept="image/png, image/jpeg, application/pdf" onChange={handleFileChange} />
          {selectedFile && <p>Selected file: {selectedFile.name}</p>}
        </div>
      );
    };

    export default FileUpload;