import { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import styles from '../styles/Home.module.css';

export default function DeteksiTembakan() {
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [predictions, setPredictions] = useState([]);
  const [error, setError] = useState(null);
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
        await addScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@1.3.1/dist/tf.min.js');
        await addScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/speech-commands@0.4.0/dist/speech-commands.min.js');
        await loadModel();
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
  }, []);

  const loadModel = async () => {
    try {
      if (!window.speechCommands) {
        setError('Speech commands library not loaded yet. Please wait...');
        return;
      }

      const URL = '/my_model/';
      const checkpointURL = URL + 'model.json';
      const metadataURL = URL + 'metadata.json';

      const recognizer = window.speechCommands.create(
        'BROWSER_FFT',
        undefined,
        checkpointURL,
        metadataURL
      );

      await recognizer.ensureModelLoaded();
      
      recognizerRef.current = recognizer;
      labelsRef.current = recognizer.wordLabels();
      
      // Initialize predictions array with labels
      const initialPredictions = recognizer.wordLabels().map(label => ({
        label,
        probability: 0
      }));
      
      setPredictions(initialPredictions);
      setIsModelLoaded(true);
      
      console.log('Model loaded successfully');
      console.log('Available labels:', recognizer.wordLabels());
    } catch (err) {
      setError(`Error loading model: ${err.message}`);
      console.error('Error loading model:', err);
    }
  };

  const startListening = async () => {
    if (!recognizerRef.current) {
      setError('Model not loaded yet.');
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

  return (
    <div className={styles.container}>
      <Head>
        <title>Deteksi Tembakan - Aplikasi Deteksi Suara</title>
        <meta name="description" content="Aplikasi deteksi tembakan dan suara lainnya" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Deteksi Tembakan
        </h1>

        <p className={styles.description}>
          Sistem pendeteksi suara tembakan dan suara lainnya
        </p>

        {error && (
          <div style={{ 
            padding: '1rem', 
            backgroundColor: '#ffdddd', 
            color: '#c00000',
            borderRadius: '0.5rem',
            marginBottom: '1rem',
            maxWidth: '600px',
            width: '100%'
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          backgroundColor: '#f0f0f0',
          padding: '2rem',
          borderRadius: '0.5rem',
          marginTop: '1.5rem',
          maxWidth: '600px',
          width: '100%'
        }}>
          <div style={{ marginBottom: '2rem' }}>
            {isModelLoaded ? (
              <p style={{ color: 'green' }}>✓ Model berhasil dimuat</p>
            ) : (
              <p>Memuat model...</p>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
            <button
              onClick={startListening}
              disabled={!isModelLoaded || isListening}
              style={{
                backgroundColor: isListening ? '#cccccc' : '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '0.3rem',
                padding: '0.7rem 1.5rem',
                fontSize: '1rem',
                cursor: isModelLoaded && !isListening ? 'pointer' : 'not-allowed',
              }}
            >
              Mulai Deteksi
            </button>
            
            <button
              onClick={stopListening}
              disabled={!isListening}
              style={{
                backgroundColor: isListening ? '#f30000' : '#cccccc',
                color: 'white',
                border: 'none',
                borderRadius: '0.3rem',
                padding: '0.7rem 1.5rem',
                fontSize: '1rem',
                cursor: isListening ? 'pointer' : 'not-allowed',
              }}
            >
              Berhenti
            </button>
          </div>

          <div style={{ width: '100%' }}>
            <h3>Hasil Deteksi:</h3>
            
            <div style={{ marginTop: '1rem' }}>
              {predictions.map((prediction, index) => (
                <div key={index} style={{ 
                  marginBottom: '0.8rem',
                  display: 'flex',
                  alignItems: 'center' 
                }}>
                  <div style={{ 
                    width: '150px', 
                    marginRight: '10px',
                    fontWeight: index === 0 ? 'bold' : 'normal'
                  }}>
                    {prediction.label}:
                  </div>
                  <div style={{ 
                    flex: 1,
                    backgroundColor: '#e0e0e0',
                    borderRadius: '5px',
                    overflow: 'hidden' 
                  }}>
                    <div style={{
                      width: `${prediction.probability * 100}%`,
                      backgroundColor: prediction.label === "Tembakan" && prediction.probability > 0.75 ? '#ff0000' : 
                                       index === 0 ? '#0070f3' : '#8cb8ff',
                      height: '24px',
                      textAlign: 'right',
                      padding: '0 10px',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      minWidth: '40px',
                      transition: 'width 0.3s ease'
                    }}>
                      {(prediction.probability * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {isListening && (
          <div style={{ 
            marginTop: '2rem', 
            padding: '1rem', 
            backgroundColor: '#e6f7ff', 
            borderRadius: '0.5rem',
            width: '100%',
            maxWidth: '600px',
            textAlign: 'center'
          }}>
            <p style={{ margin: 0 }}>
              <span style={{ 
                display: 'inline-block', 
                width: '12px', 
                height: '12px', 
                backgroundColor: '#f30000',
                borderRadius: '50%',
                marginRight: '8px'
              }}></span>
              Mendengarkan... Deteksi suara aktif
            </p>
          </div>
        )}

        <div style={{ 
          marginTop: '2rem', 
          padding: '1rem', 
          backgroundColor: '#f9f9f9', 
          borderRadius: '0.5rem',
          width: '100%',
          maxWidth: '600px',
        }}>
          <h3>Kategori Suara:</h3>
          <ul style={{ paddingLeft: '1.5rem' }}>
            <li><strong>Background Noise</strong>: Suara latar belakang umum</li>
            <li><strong>Ledakan</strong>: Suara ledakan</li>
            <li><strong>Tanpa suara</strong>: Tidak ada suara terdeteksi</li>
            <li><strong>Tembakan</strong>: Suara tembakan</li>
          </ul>
        </div>
      </main>
    </div>
  );
}