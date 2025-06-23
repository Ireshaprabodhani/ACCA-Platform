// src/admin/pages/EntryLogoPage.jsx
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { X } from 'lucide-react';

/* --------------------------------------------------
   Axios instance – token already stored in LS
-------------------------------------------------- */
const api = axios.create({
  baseURL: 'https://pc3mcwztgh.ap-south-1.awsapprunner.com/api/admin',
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});

export default function EntryLogoPage() {
  /* state */
  const [logoUrl, setLogoUrl] = useState('');
  const [file,    setFile]    = useState(null);
  const [open,    setOpen]    = useState(false);
  const [broken,  setBroken]  = useState(false);           // preview failed
  const fileInput            = useRef(null);

  /* load current logo once */
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/logo');      // GET /logo (latest)
        if (data.logo) {
          setLogoUrl(data.logo.url);
          setBroken(false);
        }
      } catch (err) {
        if (err.response?.status !== 404)
          toast.error(err.response?.data?.message || 'Load error');
      }
    })();
  }, []);

  /* helpers */
  const choose  = () => fileInput.current?.click();
  const onFile  = (e) => setFile(e.target.files[0]);

  /* upload OR replace – always PUT /logo (backend handles create/replace) */
  const save = async () => {
    if (!file) return toast.error('Choose an image first');

    const fd = new FormData();
    fd.append('logo', file);

    toast.promise(
      api.put('/logo', fd),
      { loading: 'Saving…', success: 'Saved', error: 'Error' }
    ).then(res => {
      setLogoUrl(res.data.logo.url);
      setBroken(false);
      setFile(null);
      if (fileInput.current) fileInput.current.value = '';
      setOpen(false);
    });
  };

  /* delete */
  const del = () =>
    window.confirm('Delete the logo?') &&
    toast.promise(
      api.delete('/logo'),
      { loading: 'Deleting…', success: 'Deleted', error: 'Error' }
    ).then(() => {
      setLogoUrl('');
      setBroken(false);
    });

  /* UI */
  const headerLabel = logoUrl && !broken ? 'Edit / Replace' : 'Upload';

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Toaster position="top-center" />

      {/* header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Entry Logo</h2>
        <button
          onClick={() => setOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >{headerLabel}</button>
      </div>

      {/* preview */}
      <div className="bg-white p-6 rounded shadow">
        {logoUrl && !broken ? (
          <>
            <img
              src={logoUrl}
              alt="Logo"
              className="max-w-xs h-auto rounded border mb-4"
              onError={() => {
                setBroken(true);
                toast.error('Image missing on server — upload again');
              }}
            />
            <button
              onClick={del}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >Delete Logo</button>
          </>
        ) : (
          <p className="text-gray-600 italic">No logo available. Upload one below.</p>
        )}

        {broken && (
          <div className="mt-4 p-3 bg-yellow-100 border border-yellow-400 rounded text-yellow-800">
            Broken link — file not found.<br />
            Click <span onClick={choose} className="underline cursor-pointer text-blue-600">here</span> or the button above to upload it again.
          </div>
        )}
      </div>

      {/* modal */}
      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md rounded-lg shadow-lg p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">Choose Logo</h3>
              <button onClick={() => setOpen(false)}><X size={20} /></button>
            </div>

            <input
              type="file"
              accept="image/*"
              ref={fileInput}
              onChange={onFile}
              className="w-full border rounded px-2 py-1"
            />
            {file && <p className="text-sm text-gray-600 break-all">{file.name}</p>}

            <div className="flex justify-end gap-3 pt-3">
              <button onClick={() => setOpen(false)} className="px-4 py-2 bg-gray-300 rounded">Cancel</button>
              <button onClick={save} className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
