// src/admin/pages/EntryLogoPage.jsx
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { X } from 'lucide-react';

const api = axios.create({
  baseURL: 'https://pc3mcwztgh.ap-south-1.awsapprunner.com/api/admin',
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});

export default function EntryLogoPage() {
  /* --------------------------------------------------
     state
  -------------------------------------------------- */
  const [logoUrl, setLogoUrl] = useState('');
  const [logoId, setLogoId]   = useState('');
  const [file,    setFile]    = useState(null);
  const [open,    setOpen]    = useState(false);
  const [broken,  setBroken]  = useState(false);   // true if src 404s
  const fileInput              = useRef(null);

  /* --------------------------------------------------
     fetch latest logo on mount
  -------------------------------------------------- */
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/logo');
        if (data.logo) {
          setLogoUrl(data.logo.url);
          setLogoId(data.logo._id);
          setBroken(false);
        }
      } catch (err) {
        if (err.response?.status !== 404)
          toast.error(err.response?.data?.message || 'Load error');
      }
    };
    load();
  }, []);

  /* --------------------------------------------------
     helpers
  -------------------------------------------------- */
  const choose = () => fileInput.current?.click();
  const onFile = (e) => setFile(e.target.files[0]);

  /* --------------------------------------------------
     save (upload or replace)
  -------------------------------------------------- */
  const save = async () => {
    if (!file) return toast.error('Pick an image first');

    const fd   = new FormData();
    fd.append('logo', file);

    const url    = logoId ? `/logo/${logoId}` : '/logo';
    const method = logoId ? 'put'             : 'post';

    toast.promise(
      api[method](url, fd, { headers: {} }),
      { loading: 'Saving…', success: 'Saved', error: 'Error' }
    ).then((res) => {
      setLogoUrl(res.data.logo.url);
      setLogoId(res.data.logo._id);
      setBroken(false);
      setFile(null);
      if (fileInput.current) fileInput.current.value = '';
      setOpen(false);
    });
  };

  /* --------------------------------------------------
     delete
  -------------------------------------------------- */
  const del = () =>
    window.confirm('Delete the logo?') &&
    toast.promise(
      api.delete(`/logo/${logoId}`),
      { loading: 'Deleting…', success: 'Deleted', error: 'Error' }
    ).then(() => {
      setLogoUrl('');
      setLogoId('');
      setBroken(false);
    });

  /* --------------------------------------------------
     UI
  -------------------------------------------------- */
  const headerBtnLabel = logoUrl && !broken ? 'Edit / Replace' : 'Upload';

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Toaster position="top-center" />

      {/* header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Entry Logo</h2>
        <button
          onClick={() => setOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {headerBtnLabel}
        </button>
      </div>

      {/* preview card */}
      <div className="bg-white p-6 rounded shadow">
        {logoUrl && !broken ? (
          <>
            <img
              src={logoUrl}
              alt="Logo"
              className="max-w-xs h-auto rounded border mb-4"
              onError={() => {
                setBroken(true);
                toast.error('Image not found on server — upload it again');
              }}
            />
            <button
              onClick={del}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Delete Logo
            </button>
          </>
        ) : (
          <p className="text-gray-600 italic">No logo available. Upload one below.</p>
        )}

        {broken && (
          <div className="mt-4 p-3 bg-yellow-100 border border-yellow-400 rounded text-yellow-800">
            Broken link — the file is missing on the server.<br />
            Click <span onClick={choose} className="underline cursor-pointer text-blue-600">here</span> or the button above to upload the image again.
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
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 bg-gray-300 rounded"
              >Cancel</button>
              <button
                onClick={save}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
