import React, { useState, useEffect } from 'react';
import banner1 from '../../../assets/banner1.png';
import banner2 from '../../../assets/banner2.png';
import banner3 from '../../../assets/banner3.png';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Promotion {
    id: number;
    code: string;
    name: string;
    description: string;
    discountPercent: number;
    maxDiscountAmount: number;
    minOrderAmount: number;
    startAt: string;
    endAt: string;
    isActive: boolean;
}

interface PromotionApiResponse {
    success: boolean;
    message: string;
    data: Promotion[];
}

// Generate random particles data once
const generateParticles = () => {
    return Array.from({ length: 6 }, (_, i) => ({
        id: i,
        width: Math.random() * 100 + 50,
        height: Math.random() * 100 + 50,
        left: Math.random() * 100,
        top: Math.random() * 100,
        duration: Math.random() * 10 + 15,
        delay: i * 0.5,
    }));
};

const particlesData = generateParticles();

// Particle component for background effect
const Particle: React.FC<{ particle: typeof particlesData[0] }> = ({ particle }) => {
    return (
        <div
            className="absolute rounded-full bg-purple-300/20 pointer-events-none"
            style={{
                width: particle.width + 'px',
                height: particle.height + 'px',
                left: particle.left + '%',
                top: particle.top + '%',
                animation: `float ${particle.duration}s infinite ease-in-out`,
                animationDelay: particle.delay + 's',
            }}
        />
    );
};

const Banner: React.FC = () => {
    const images = [banner1, banner2, banner3];
    const [currentIndex, setCurrentIndex] = useState(0);
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [promotionIndex, setPromotionIndex] = useState(0);
    const [promotionLoading, setPromotionLoading] = useState(true);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price);
    };

    // Auto slide every 3 seconds
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % images.length);
        }, 3000);

        return () => clearInterval(timer);
    }, [images.length]);

    useEffect(() => {
        const fetchPromotions = async () => {
            try {
                setPromotionLoading(true);
                const token = localStorage.getItem('token');
                const response = await fetch('http://localhost:8080/api/user/promotions/available', {
                    headers: token
                        ? {
                            Authorization: `Bearer ${token}`,
                        }
                        : undefined,
                });

                if (!response.ok) {
                    throw new Error('Không thể tải khuyến mãi');
                }

                const result: PromotionApiResponse = await response.json();
                setPromotions(result.data || []);
            } catch {
                setPromotions([]);
            } finally {
                setPromotionLoading(false);
            }
        };

        fetchPromotions();
    }, []);

    useEffect(() => {
        if (promotions.length <= 1) return;

        const promotionTimer = setInterval(() => {
            setPromotionIndex((prev) => (prev + 1) % promotions.length);
        }, 2800);

        return () => clearInterval(promotionTimer);
    }, [promotions]);

    const goToSlide = (index: number) => {
        setCurrentIndex(index);
    };

    const goToPrevious = () => {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    const goToNext = () => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
    };

    const handleExplore = () => {
        window.scrollBy({
            top: 390,
            behavior: 'smooth',
        });
    };

    const goToPreviousPromotion = () => {
        if (promotions.length === 0) return;
        setPromotionIndex((prev) => (prev - 1 + promotions.length) % promotions.length);
    };

    const goToNextPromotion = () => {
        if (promotions.length === 0) return;
        setPromotionIndex((prev) => (prev + 1) % promotions.length);
    };

    const activePromotion = promotions[promotionIndex];

    return (
        <>
            <style>{`
                @keyframes float {
                    0%, 100% {
                        transform: translateY(0px) translateX(0px);
                        opacity: 0;
                    }
                    10% {
                        opacity: 0.5;
                    }
                    50% {
                        opacity: 0.3;
                    }
                    90% {
                        opacity: 0.5;
                    }
                    100% {
                        transform: translateY(-100vh) translateX(100px);
                        opacity: 0;
                    }
                }
                
                @keyframes gradientShift {
                    0%, 100% {
                        background-position: 0% 50%;
                    }
                    50% {
                        background-position: 100% 50%;
                    }
                }
                
                .gradient-animated {
                    background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
                    background-size: 400% 400%;
                    animation: gradientShift 15s ease infinite;
                }

                @keyframes fadeUp {
                    0% {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes flashGlow {
                    0%,
                    100% {
                        box-shadow: 0 0 0 rgba(147, 51, 234, 0.2);
                        opacity: 0.88;
                    }
                    50% {
                        box-shadow: 0 0 24px rgba(236, 72, 153, 0.5);
                        opacity: 1;
                    }
                }

                .promo-flash {
                    animation: flashGlow 1.2s infinite ease-in-out;
                }

                @keyframes hotBlink {
                    0%,
                    100% {
                        opacity: 1;
                        transform: scale(1);
                    }
                    50% {
                        opacity: 0.45;
                        transform: scale(1.08);
                    }
                }

                .hot-badge-blink {
                    animation: hotBlink 0.9s infinite ease-in-out;
                }
            `}</style>

            <div className="w-full min-h-[400px] relative overflow-hidden">
                {/* Animated Gradient Background */}
                <div className="absolute inset-0 gradient-animated opacity-20" />

                {/* Particle Background */}
                <div className="absolute inset-0 overflow-hidden">
                    {particlesData.map((particle) => (
                        <Particle key={particle.id} particle={particle} />
                    ))}
                </div>

                {/* Content */}
                <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-2 items-center gap-8 lg:gap-12 min-h-[400px] relative z-10">
                    {/* Left Section - Text Introduction */}
                    <div className="w-full max-w-[520px] mx-auto lg:mx-0 space-y-6 flex flex-col items-center lg:items-start">
                        <div className="w-full flex flex-col items-center">
                            <h1
                                className="h-14 text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-3 text-center"
                                style={{ animation: 'fadeUp 0.8s ease 0s both' }}
                            >
                                StyleStore
                            </h1>
                            <div
                                className="relative w-full max-w-[460px] h-[150px] rounded-lg border border-purple-200 bg-white/80 backdrop-blur-sm px-3.5 py-3 promo-flash overflow-hidden"
                                style={{ animation: 'fadeUp 0.8s ease 0.1s both' }}
                            >
                                {promotions.length > 1 && (
                                    <>
                                        <button
                                            onClick={goToPreviousPromotion}
                                            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white text-purple-700 rounded-full p-1 shadow-md transition"
                                            aria-label="Khuyến mãi trước"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={goToNextPromotion}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white text-purple-700 rounded-full p-1 shadow-md transition"
                                            aria-label="Khuyến mãi tiếp theo"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </>
                                )}
                                {!promotionLoading && activePromotion && (
                                    <div className="absolute top-2 right-2 z-20">
                                        <span className="relative inline-flex items-center justify-center px-3 py-1 rounded-full bg-gradient-to-r from-fuchsia-500 to-rose-500 text-white text-base font-extrabold tracking-wide shadow-lg ring-2 ring-white/80 hot-badge-blink">
                                            -{activePromotion.discountPercent}%
                                            <span className="absolute -top-2 -right-1 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[9px] font-extrabold tracking-wide leading-none">
                                                HOT
                                            </span>
                                        </span>
                                    </div>
                                )}
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-purple-700 mb-1.5 px-10">
                                    Ưu đãi nổi bật hôm nay
                                </p>

                                {promotionLoading ? (
                                    <p className="text-xs text-slate-600 px-10">Đang tải khuyến mãi hấp dẫn...</p>
                                ) : activePromotion ? (
                                    <div className="px-10">
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="font-extrabold text-pink-600 text-base leading-none">{activePromotion.code}</p>
                                        </div>
                                        <p className="text-xs font-semibold text-slate-800 mt-1">{activePromotion.name}</p>
                                        <p className="text-[11px] text-slate-600 mt-1 line-clamp-1">{activePromotion.description}</p>
                                        <p className="text-[11px] text-slate-500 mt-1.5">
                                            Tối thiểu {formatPrice(activePromotion.minOrderAmount)} · Giảm tối đa {formatPrice(activePromotion.maxDiscountAmount)}
                                        </p>
                                        {promotions.length > 1 && (
                                            <div className="mt-2.5 flex gap-1.5">
                                                {promotions.map((promotion, index) => (
                                                    <span
                                                        key={promotion.id}
                                                        className={`h-1.5 rounded-full transition-all ${index === promotionIndex ? 'w-6 bg-purple-600' : 'w-2 bg-purple-200'
                                                            }`}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-600 px-10">Hiện chưa có khuyến mãi khả dụng.</p>
                                )}
                            </div>
                        </div>
                        <div className="flex justify-center gap-4 w-full" style={{ animation: 'fadeUp 0.8s ease 0.2s both' }}>
                            <button
                                onClick={handleExplore}
                                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold shadow-md hover:shadow-lg"
                            >
                                Khám Phá Ngay
                            </button>
                        </div>
                    </div>

                    {/* Right Section - Image Carousel */}
                    <div className="w-full max-w-[560px] mx-auto lg:mx-0 relative group" style={{ animation: 'fadeUp 0.9s ease 0.25s both' }}>
                        {/* Image Container */}
                        <div className="relative w-full h-80 rounded-2xl overflow-hidden shadow-2xl">
                            {images.map((image, index) => (
                                <div
                                    key={index}
                                    className={`absolute w-full h-full transition-opacity duration-1000 ${index === currentIndex ? 'opacity-100' : 'opacity-0'
                                        }`}
                                >
                                    <img
                                        src={image}
                                        alt={`Banner ${index + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ))}

                            {/* Previous Button */}
                            <button
                                onClick={goToPrevious}
                                className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-white/80 hover:bg-white text-slate-800 rounded-full p-2 transition-all opacity-0 group-hover:opacity-100 shadow-lg"
                                aria-label="Previous image"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>

                            {/* Next Button */}
                            <button
                                onClick={goToNext}
                                className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-white/80 hover:bg-white text-slate-800 rounded-full p-2 transition-all opacity-0 group-hover:opacity-100 shadow-lg"
                                aria-label="Next image"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Dots Navigation */}
                        <div className="flex justify-center gap-2 mt-4">
                            {images.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => goToSlide(index)}
                                    className={`w-2.5 h-2.5 rounded-full transition-all ${index === currentIndex
                                        ? 'bg-purple-600 w-8'
                                        : 'bg-slate-300 hover:bg-slate-400'
                                        }`}
                                    aria-label={`Go to slide ${index + 1}`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Banner;
