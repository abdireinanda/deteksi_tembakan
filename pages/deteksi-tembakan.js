import { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import styles from '../styles/Home.module.css';

export default function DeteksiTembakan() {
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [predictions, setPredictions] = useState([]);
  const [error, setError] = useState(null);
  const [isLoadingModel, setIsLoadingModel] = useState(false);
  const recognizerRef = useRef(null);
  const labelsRef = useRef([]);

  useEffect(() => {
    // Add necessary scripts
    const addScript = (src) => {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        document.body.appendChild(script);
      });
    };

    const loadScripts = async () => {
      try {
        await addScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@3.15.0/dist/tf.min.js');
        await addScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/speech-commands@0.5.4/dist/speech-commands.min.js');
        // Tunggu sedikit untuk memastikan script sudah dimuat dengan sempurna
        setTimeout(() => {
          loadModel();
        }, 1000);
      } catch (err) {
        setError(`Error loading scripts: ${err.message}`);
        console.error('Error loading scripts:', err);
      }
    };

    if (typeof window !== 'undefined') {
      loadScripts();
    }

    // Cleanup on component unmount
    return () => {
      if (recognizerRef.current) {
        recognizerRef.current.stopListening();
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadModel = async () => {
    // Jika sedang memuat, jangan coba memuat lagi
    if (isLoadingModel) return;
     
    setIsLoadingModel(true);
    try {
      if (!window.speechCommands) {
        setError('Speech commands library not loaded yet. Please wait or try refreshing the page.');
        return;
      }

      // Bersihkan memori jika tensorflow sudah dimuat
      if (window.tf) {
        window.tf.engine().purgeUnusedTensors();
        console.log('Cleaned up TensorFlow memory');
      }
      
      // Hentikan recognizer sebelumnya jika ada
      if (recognizerRef.current) {
        try {
          await recognizerRef.current.stopListening();
          recognizerRef.current = null;
          console.log('Stopped previous recognizer');
        } catch (e) {
          console.log('Error cleaning up previous model:', e);
        }
      }

      // Gunakan window.location.origin untuk mendapatkan URL dasar
      const baseURL = window.location.origin;
      const URL = `${baseURL}/my_model/`;
      const checkpointURL = `${URL}model.json`;
      const metadataURL = `${URL}metadata.json`;

      console.log('Loading model from:', checkpointURL);
      console.log('Loading metadata from:', metadataURL);

      const recognizer = window.speechCommands.create(
        'BROWSER_FFT',
        undefined,
        checkpointURL,
        metadataURL
      );

      // Tambahkan log untuk debugging
      console.log('Recognizer created, loading model...');
      
      try {
        await recognizer.ensureModelLoaded();
        console.log('Model loaded successfully!');
      } catch (modelError) {
        console.error('Error loading model:', modelError);
        
        // Reload halaman jika error terkait variabel sudah terdaftar
        if (modelError.message && modelError.message.includes('already registered')) {
          console.error('Model loading conflict detected, reloading page...');
          window.location.reload();
          return;
        }
        
        setError(`Error loading model: ${modelError.message}`);
        return;
      }
      
      recognizerRef.current = recognizer;
      
      try {
        const labels = recognizer.wordLabels();
        console.log('Available labels:', labels);
        labelsRef.current = labels;
        
        // Initialize predictions array with labels
        const initialPredictions = labels.map(label => ({
          label,
          probability: 0
        }));
        
        setPredictions(initialPredictions);
        setIsModelLoaded(true);
      } catch (labelsError) {
        console.error('Error getting labels:', labelsError);
        setError(`Error getting labels: ${labelsError.message}`);
      }
    } catch (err) {
      console.error('General error in loadModel:', err);
      setError(`Error in model setup: ${err.message}`);
    } finally {
      setIsLoadingModel(false);
    }
  };

  const startListening = async () => {
    if (!recognizerRef.current) {
      setError('Model not loaded yet. Please wait or refresh the page.');
      return;
    }

    try {
      recognizerRef.current.listen(
        result => {
          const scores = result.scores;
          const updatedPredictions = labelsRef.current.map((label, index) => ({
            label,
            probability: scores[index]
          }));
          
          // Sort by probability (highest first)
          updatedPredictions.sort((a, b) => b.probability - a.probability);
          
          setPredictions(updatedPredictions);
        },
        {
          includeSpectrogram: true,
          probabilityThreshold: 0.75,
          invokeCallbackOnNoiseAndUnknown: true,
          overlapFactor: 0.50
        }
      );
      
      setIsListening(true);
    } catch (err) {
      setError(`Error starting audio detection: ${err.message}`);
      console.error('Error starting audio detection:', err);
    }
  };

  const stopListening = () => {
    if (recognizerRef.current) {
      recognizerRef.current.stopListening();
      setIsListening(false);
    }
  };

  // Function to get icon for sound type
  const getSoundIcon = (label) => {
    switch(label) {
      case 'Tembakan':
        return '🔫';
      case 'Ledakan':
        return '💥';
      case 'Background Noise':
        return '🔊';
      case 'Tanpa suara':
        return '🔇';
      default:
        return '🎵';
    }
  };

  // Function to get color for sound type
  const getSoundColor = (label, probability) => {
    if (label === 'Tembakan' && probability > 0.7) {
      return '#ff0000';
    } else if (label === 'Ledakan' && probability > 0.7) {
      return '#ff6600';
    } else if (probability > 0.8) {
      return '#0070f3';
    } else if (probability > 0.5) {
      return '#8cb8ff';
    } else {
      return '#aaaaaa';
    }
  };

  return (
    <div style={{
      backgroundColor: '#f5f5f5',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <Head>
        <title>Deteksi Tembakan - Sistem Pendeteksi Suara</title>
        <meta name="description" content="Aplikasi deteksi tembakan dan suara lainnya menggunakan AI" />
        <link rel="icon" href="/favicon.ico" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet" />
        <style jsx global>{`
          body {
            margin: 0;
            padding: 0;
            font-family: 'Poppins', sans-serif;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(30, 136, 229, 0.7); }
            70% { box-shadow: 0 0 0 10px rgba(30, 136, 229, 0); }
            100% { box-shadow: 0 0 0 0 rgba(30, 136, 229, 0); }
          }
          @keyframes blink {
            0% { opacity: 1; }
            50% { opacity: 0.4; }
            100% { opacity: 1; }
          }
        `}</style>
      </Head>

      <div style={{
        backgroundColor: '#222',
        color: 'white',
        padding: '1rem',
        textAlign: 'center',
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
      }}>
        <h1 style={{ margin: '0.5rem 0', fontSize: '2rem' }}>
          🔫 Sistem Deteksi Tembakan
        </h1>
      </div>

      <main style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '2rem 1rem'
      }}>
        <div style={{
          backgroundColor: '#222',
          color: 'white',
          borderRadius: '10px',
          padding: '1.5rem',
          marginBottom: '2rem',
          textAlign: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
        }}>
          <h2 style={{ margin: '0', marginBottom: '1rem' }}>
            Monitoring Suara Real-time
          </h2>
          <p style={{ margin: '0', color: '#ccc' }}>
            Sistem deteksi suara berbasis kecerdasan buatan untuk mendeteksi tembakan, ledakan, dan jenis suara lainnya
          </p>
        </div>

        {error && (
          <div style={{ 
            padding: '1rem', 
            backgroundColor: '#ffdddd', 
            color: '#c00000',
            borderRadius: '0.5rem',
            marginBottom: '1rem',
            boxShadow: '0 2px 8px rgba(255,0,0,0.1)'
          }}>
            <strong>Error:</strong> {error}
            <div style={{ marginTop: '1rem' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  backgroundColor: '#c00000',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.3rem',
                  padding: '0.5rem 1rem',
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                Reload Aplikasi
              </button>
            </div>
          </div>
        )}

        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '10px',
          marginBottom: '2rem',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
        }}>
          <div style={{ 
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%'
          }}>
            {!isModelLoaded ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  display: 'inline-block',
                  width: '50px',
                  height: '50px',
                  border: '5px solid #f3f3f3',
                  borderTop: '5px solid #3498db',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  marginBottom: '1rem'
                }}></div>
                <p>Memuat model AI... Harap tunggu</p>
              </div>
            ) : (
              <div style={{ 
                backgroundColor: '#e8f5e9', 
                color: '#2e7d32',
                padding: '1rem',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                justifyContent: 'center'
              }}>
                <span style={{ fontSize: '24px', marginRight: '10px' }}>✓</span>
                <span>Model AI berhasil dimuat dan siap digunakan</span>
              </div>
            )}
          </div>

          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            marginBottom: '2rem',
            width: '100%',
            justifyContent: 'center'
          }}>
            <button
              onClick={startListening}
              disabled={!isModelLoaded || isListening}
              style={{
                backgroundColor: isListening ? '#cccccc' : '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '50px',
                padding: '0.8rem 2rem',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: isModelLoaded && !isListening ? 'pointer' : 'not-allowed',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <span style={{ marginRight: '8px', fontSize: '18px' }}>▶️</span>
              Mulai Deteksi
            </button>
            
            <button
              onClick={stopListening}
              disabled={!isListening}
              style={{
                backgroundColor: isListening ? '#f44336' : '#cccccc',
                color: 'white',
                border: 'none',
                borderRadius: '50px',
                padding: '0.8rem 2rem',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: isListening ? 'pointer' : 'not-allowed',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <span style={{ marginRight: '8px', fontSize: '18px' }}>⏹️</span>
              Berhenti
            </button>
          </div>

          <div style={{ width: '100%' }}>
            <h3 style={{ 
              borderBottom: '2px solid #f0f0f0', 
              paddingBottom: '0.5rem',
              marginBottom: '1.5rem',
              color: '#333'
            }}>
              <span style={{ marginRight: '10px' }}>📊</span>
              Hasil Deteksi Suara:
            </h3>
            
            <div style={{ marginTop: '1rem' }}>
              {predictions.map((prediction, index) => (
                <div key={index} style={{ 
                  marginBottom: '1rem',
                  backgroundColor: index === 0 ? '#f8f9fa' : 'transparent',
                  padding: '0.8rem',
                  borderRadius: '8px',
                  boxShadow: index === 0 ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                  border: index === 0 && prediction.probability > 0.75 ? `2px solid ${getSoundColor(prediction.label, prediction.probability)}` : 'none',
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '0.5rem'
                  }}>
                    <div style={{ 
                      fontSize: '1.5rem', 
                      marginRight: '0.8rem',
                      width: '40px',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: index === 0 ? getSoundColor(prediction.label, prediction.probability) : '#f0f0f0',
                      color: index === 0 ? 'white' : '#666',
                      borderRadius: '50%'
                    }}>
                      {getSoundIcon(prediction.label)}
                    </div>
                    <div style={{ 
                      fontWeight: index === 0 ? 'bold' : 'normal',
                      fontSize: index === 0 ? '1.1rem' : '1rem',
                      color: index === 0 ? '#333' : '#666'
                    }}>
                      {prediction.label}
                    </div>
                  </div>
                  
                  <div style={{ 
                    backgroundColor: '#f0f0f0',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    height: '12px'
                  }}>
                    <div style={{
                      width: `${prediction.probability * 100}%`,
                      backgroundColor: getSoundColor(prediction.label, prediction.probability),
                      height: '100%',
                      transition: 'width 0.3s ease, background-color 0.3s ease'
                    }}></div>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '0.5rem',
                    fontSize: '0.85rem',
                    color: '#666'
                  }}>
                    <span>0%</span>
                    <span style={{ 
                      fontWeight: 'bold',
                      color: index === 0 ? getSoundColor(prediction.label, prediction.probability) : '#666'
                    }}>
                      {(prediction.probability * 100).toFixed(1)}%
                    </span>
                    <span>100%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {isListening && (
          <div style={{ 
            marginBottom: '2rem', 
            padding: '1rem', 
            backgroundColor: '#1e88e5', 
            color: 'white',
            borderRadius: '10px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            animation: 'pulse 1.5s infinite'
          }}>
            <div style={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{ 
                width: '16px', 
                height: '16px', 
                backgroundColor: '#f30000',
                borderRadius: '50%',
                marginRight: '12px',
                animation: 'blink 1s infinite'
              }}></div>
              <span style={{ fontWeight: 'bold' }}>Mendengarkan...</span> 
              <span style={{ marginLeft: '8px' }}>
                Sistem aktif mendeteksi suara
              </span>
            </div>
          </div>
        )}

        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{ 
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '10px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ 
              color: '#333',
              display: 'flex',
              alignItems: 'center',
              marginTop: '0'
            }}>
              <span style={{ marginRight: '10px', fontSize: '1.5rem' }}>🔊</span>
              Kategori Suara
            </h3>
            <ul style={{ 
              listStyle: 'none',
              padding: '0',
              margin: '0'
            }}>
              {[
                { label: 'Background Noise', desc: 'Suara latar belakang umum', icon: '🔊' },
                { label: 'Ledakan', desc: 'Suara ledakan keras', icon: '💥' },
                { label: 'Tanpa suara', desc: 'Tidak ada suara terdeteksi', icon: '🔇' },
                { label: 'Tembakan', desc: 'Suara tembakan senjata api', icon: '🔫' }
              ].map((item, i) => (
                <li key={i} style={{ 
                  padding: '0.8rem 0',
                  borderBottom: i < 3 ? '1px solid #f0f0f0' : 'none',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <span style={{ 
                    fontSize: '1.5rem',
                    marginRight: '1rem',
                    width: '36px', 
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {item.icon}
                  </span>
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#333' }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#666' }}>
                      {item.desc}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div style={{ 
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '10px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ 
              color: '#333',
              display: 'flex',
              alignItems: 'center',
              marginTop: '0'
            }}>
              <span style={{ marginRight: '10px', fontSize: '1.5rem' }}>💡</span>
              Tips Penggunaan
            </h3>
            <ol style={{ 
              paddingLeft: '1.5rem',
              margin: '0',
              color: '#333'
            }}>
              <li style={{ marginBottom: '0.8rem' }}>
                Pastikan mengizinkan akses mikrofon saat browser memintanya
              </li>
              <li style={{ marginBottom: '0.8rem' }}>
                Untuk hasil terbaik, gunakan di lingkungan dengan sedikit bising
              </li>
              <li style={{ marginBottom: '0.8rem' }}>
                Jika deteksi tidak berfungsi, coba refresh halaman
              </li>
              <li style={{ marginBottom: '0' }}>
                Semakin tinggi persentase, semakin yakin sistem terhadap deteksi suara
              </li>
            </ol>
          </div>
        </div>

        <button
          onClick={() => window.location.reload()}
          style={{
            backgroundColor: '#f5f5f5',
            color: '#666',
            border: '1px solid #ddd',
            borderRadius: '5px',
            padding: '0.7rem 1.5rem',
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'block',
            margin: '0 auto',
            transition: 'all 0.3s ease'
          }}
        >
          Reset Aplikasi
        </button>
      </main>

      <footer style={{ 
        backgroundColor: '#222',
        color: 'white',
        textAlign: 'center',
        padding: '1rem',
        marginTop: '2rem',
        fontSize: '0.9rem' 
      }}>
        <p style={{ margin: '0' }}>
          Sistem Deteksi Tembakan &copy; {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}