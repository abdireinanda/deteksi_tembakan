import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import Link from 'next/link'

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Deteksi Tembakan</title>
        <meta name="description" content="Aplikasi deteksi tembakan dan suara lainnya" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Sistem Deteksi Tembakan
        </h1>

        <p className={styles.description}>
          Aplikasi pendeteksi suara tembakan, ledakan, dan suara lainnya
        </p>

        <div className={styles.grid}>
          <Link href="/deteksi-tembakan">
            <div className={styles.card}>
              <h2>Mulai Deteksi &rarr;</h2>
              <p>Deteksi suara: Tembakan, Ledakan, Background Noise, dan Tanpa suara</p>
            </div>
          </Link>
        </div>
      </main>

      <footer className={styles.footer}>
        <a
          href="https://vercel.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          Kelompok 5 : Muhammad Abdi Reinanda, Brandon Josua Christian, Julian Yang, Hezel Anthonie Norman Piter Papia, Okhama Siladata Devisepte{' '}
          <span className={styles.logo}>
            <Image src="/vercel.svg" alt="Vercel Logo" width={72} height={16} />
          </span>
        </a>
      </footer>
    </div>
  )
}