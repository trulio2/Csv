import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CsvCard from './CsvCard';
import './App.css';

const App: React.FC = () => {
  const [csvData, setCsvData] = useState<Array<{ [key: string]: string }>>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [fileId, setFileId] = useState(0);
  const [files, setFiles] = useState([]);

  useEffect(() => {
    fetchIds();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await axios
          .get(
            `http://localhost:3000/api/users?q=${searchTerm}&fileId=${fileId}`
          )
          .then((response) => {
            if (response.data) setCsvData(response.data);
          })
          .catch((error) => {
            if (error.response) {
              toast.error(error.response.data.message);
            }
          });
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, [searchTerm, fileId]);

  const fetchIds = async () => {
    await fetch('http://localhost:3000/api/ids')
      .then((response) => response.json())
      .then((ids) => {
        if (ids) setFiles(ids);
      })
      .catch((error) => {
        console.error('Error fetching IDs: ', error);
      });
  };

  const onIdChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newFileId = Number(e.target.value);
    setFileId(newFileId);
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios
        .post('http://localhost:3000/api/files', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
        .then(async (response) => {
          if (response.data) {
            await fetchIds();
            setFileId(response.data.fileId);
            toast.success('File uploaded successfully');
          }
        })
        .catch((error) => {
          if (error.response) {
            toast.error(error.response.data.message);
          }
        });
    } catch (error) {
      console.error('File upload failed:', error);
    }
  };

  const filteredData = csvData.filter((row) =>
    Object.values(row).some((val) =>
      val.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="App">
      <h1>Csv Front</h1>
      <select onChange={onIdChange} value={fileId}>
        <option value={0}>All</option>
        {files.map((id, index) => (
          <option key={index} value={id}>
            {id}
          </option>
        ))}
      </select>
      <br />
      <input
        type="file"
        accept=".csv"
        onChange={onFileChange}
        style={{
          marginTop: '10px',
        }}
      />
      <br />
      <input
        type="text"
        placeholder="Search..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{
          marginTop: '10px',
        }}
      />
      <div className="card-container">
        {filteredData.map((row, index) => (
          <CsvCard key={index} data={row} />
        ))}
      </div>
      <ToastContainer />
    </div>
  );
};

export default App;
