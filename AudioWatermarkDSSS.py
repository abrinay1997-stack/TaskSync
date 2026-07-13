import numpy as np
from scipy.io import wavfile
import scipy.signal as signal
import pywt

class AudioWatermarkDSSS:
    def __init__(self, key=42, alpha=0.05, threshold=0.1):
        self.key = key
        self.alpha = alpha
        self.threshold = threshold
        self.wavelet = 'db1'
        self.level = 2

    def _generate_pn_sequence(self, length):
        np.random.seed(self.key)
        # Secuencia pseudo-aleatoria antipodal (+1 o -1)
        return np.where(np.random.rand(length) > 0.5, 1, -1)

    def embed(self, input_wav, output_wav):
        # Leer archivo WAV
        fs, data = wavfile.read(input_wav)
        
        # Normalización a float (-1.0 a 1.0)
        if data.dtype == np.int16:
            data_norm = data.astype(np.float32) / 32768.0
        else:
            data_norm = data.astype(np.float32)

        # Aplicando DWT Nivel 2
        coeffs = pywt.wavedec(data_norm, self.wavelet, level=self.level)
        cA2, cD2, cD1 = coeffs

        # Generar secuencia PN
        pn_seq = self._generate_pn_sequence(len(cD2))

        # Incrustación: Y = X + alpha * W en coeficientes de Detalle de Segundo Nivel (cD2)
        cD2_wm = cD2 + self.alpha * pn_seq
        coeffs_wm = [cA2, cD2_wm, cD1]

        # Reconstrucción
        data_wm_norm = pywt.waverec(coeffs_wm, self.wavelet)
        
        # Ajustar longitud si es necesario por la DWT
        if len(data_wm_norm) > len(data_norm):
            data_wm_norm = data_wm_norm[:len(data_norm)]

        # Reconvertir a np.int16
        data_wm = np.int16(np.clip(data_wm_norm, -1.0, 1.0) * 32767.0)
        wavfile.write(output_wav, fs, data_wm)
        return fs, data, data_wm

    def extract(self, suspected_audio):
        fs, data = suspected_audio
        if data.dtype == np.int16:
            data_norm = data.astype(np.float32) / 32768.0
        else:
            data_norm = data.astype(np.float32)

        # Aplicando DWT Nivel 2 al audio sospechoso
        coeffs = pywt.wavedec(data_norm, self.wavelet, level=self.level)
        _, cD2_susp, _ = coeffs

        pn_seq = self._generate_pn_sequence(len(cD2_susp))

        # Correlación Cruzada Normalizada para buscar el pico
        # Usamos correlate para resistencia al desajuste (Jittering)
        corr = signal.correlate(cD2_susp, pn_seq, mode='valid')
        score = np.max(corr) / len(pn_seq)  # Normalizar score

        return score > self.threshold, score

def run_test():
    # Generar audio de prueba simple (tono seno)
    fs = 44100
    t = np.linspace(0, 2, fs * 2, endpoint=False)
    test_audio = np.int16(np.sin(2 * np.pi * 440 * t) * 10000)
    wavfile.write("test_original.wav", fs, test_audio)

    wm = AudioWatermarkDSSS(key=123, alpha=0.01)
    
    # Embed
    _, orig, watermarked = wm.embed("test_original.wav", "test_watermarked.wav")

    # PSNR (Invisibilidad)
    mse = np.mean((orig.astype(float) - watermarked.astype(float)) ** 2)
    if mse == 0:
        psnr = 100
    else:
        max_pixel = 32767.0
        psnr = 20 * np.log10(max_pixel / np.sqrt(mse))
    print(f"PSNR: {psnr:.2f} dB")

    # ATAQUE 1: Ruido Gaussiano
    noise = np.random.normal(0, 500, len(watermarked))
    attack1_audio = np.int16(np.clip(watermarked + noise, -32768, 32767))
    detected1, score1 = wm.extract((fs, attack1_audio))
    print(f"Ataque 1 (Ruido) - Detectado: {detected1} (Score: {score1:.4f})")

    # ATAQUE 2: Recorte/Desincronización
    attack2_audio = watermarked[fs//4:]
    detected2, score2 = wm.extract((fs, attack2_audio))
    print(f"Ataque 2 (Recorte) - Detectado: {detected2} (Score: {score2:.4f})")

if __name__ == "__main__":
    run_test()
