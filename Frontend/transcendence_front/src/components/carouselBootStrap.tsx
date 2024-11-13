import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import bootstrap from 'bootstrap/dist/js/bootstrap.bundle.min';
import 'bootstrap/dist/css/bootstrap.min.css';
import "./carouselBootStrap.css"

// Import dynamique de Bootstrap pour éviter les erreurs côté serveur
const Bootstrap = dynamic(() => import('bootstrap/dist/js/bootstrap.bundle.min'), { ssr: false });

const MyCarousel = () => {
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const [isBootstrapLoaded, setIsBootstrapLoaded] = useState(false);

  useEffect(() => {
    if (carouselRef.current && isBootstrapLoaded) {
      // Vérification que Bootstrap est bien chargé
      if (typeof bootstrap !== 'undefined') {
        const carouselInstance = new bootstrap.Carousel(carouselRef.current, {
          interval: 2000,
          touch: false,
        });

        return () => {
          // Nettoyage de l'instance pour éviter les fuites de mémoire
          carouselInstance.dispose();
        };
      } else {
        console.error('Bootstrap is not loaded');
      }
    }
  }, [isBootstrapLoaded]);

  useEffect(() => {
    // Ce useEffect est utilisé pour détecter quand Bootstrap est complètement chargé
    if (typeof bootstrap !== 'undefined') {
      setIsBootstrapLoaded(true);
    }
  }, []);

  return (
    <div className='carousel-container'>
      <div id='myCarousel' ref={carouselRef} className='carousel slide carousel-container flex items-center justify-center'>
        <div className='carousel-indicators'>
          <button type='button' data-bs-target='#myCarousel' data-bs-slide-to='0' className='active' aria-current='true' aria-label='Slide 1'></button>
          <button type='button' data-bs-target='#myCarousel' data-bs-slide-to='1' aria-label='Slide 2'></button>
          <button type='button' data-bs-target='#myCarousel' data-bs-slide-to='2' aria-label='Slide 3'></button>
        </div>
        <div className='carousel-inner'>
          <div className='carousel-item active'>
            <img src='/img/ehouot.png' className='mx-auto' alt='...' />
            <div className='carousel-caption d-none d-md-block'>
              <h5>Emilien Houot | ehouot</h5>
              <div className='social-icons'>
                <a href='https://www.linkedin.com/in/emilien-houot/' target='_blank' rel='noopener noreferrer'>
                  <img src='/img/linkedin32.png' alt='LinkedIn' className='social-icon' />
                </a>
                <a href='https://github.com/EmlHT' target='_blank' rel='noopener noreferrer'>
                  <img src='/img/github32.png' alt='GitHub' className='social-icon' />
                </a>
              </div>
            </div>
          </div>
          <div className='carousel-item'>
            <img src='/img/bleclerc.png' className='d-block w-100' alt='...' />
            <div className='carousel-caption d-none d-md-block'>
              <h5>Brett Leclerc | bleclerc</h5>
              <div className='social-icons'>
                <a href='https://www.linkedin.com/in/brett-leclerc/' target='_blank' rel='noopener noreferrer'>
                  <img src='/img/linkedin32.png' alt='LinkedIn' className='social-icon' />
                </a>
                <a href='https://github.com/brettleclerc13' target='_blank' rel='noopener noreferrer'>
                  <img src='/img/github32.png' alt='GitHub' className='social-icon' />
                </a>
              </div>
            </div>
          </div>
          <div className='carousel-item'>
            <img src='/img/lkukhale.png' className='d-block w-100' alt='...' />
            <div className='carousel-caption d-none d-md-block'>
              <h5>Levan Kukhaleishvili | lkukhale</h5>
              <div className='social-icons'>
                <a href='https://www.linkedin.com/in/levan-kukhaleishvili-15a58020b/' target='_blank' rel='noopener noreferrer'>
                  <img src='/img/linkedin32.png' alt='LinkedIn' className='social-icon' />
                </a>
                <a href='https://github.com/Manwe314' target='_blank' rel='noopener noreferrer'>
                  <img src='/img/github32.png' alt='GitHub' className='social-icon' />
                </a>
              </div>
            </div>
          </div>
        </div>
        <button className='carousel-control-prev' type='button' data-bs-target='#myCarousel' data-bs-slide='prev'>
          <span className='carousel-control-prev-icon' aria-hidden='true'></span>
          <span className='visually-hidden'>Previous</span>
        </button>
        <button className='carousel-control-next' type='button' data-bs-target='#myCarousel' data-bs-slide='next'>
          <span className='carousel-control-next-icon' aria-hidden='true'></span>
          <span className='visually-hidden'>Next</span>
        </button>
      </div>
    </div>
  );
};

export default MyCarousel;

