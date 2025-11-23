import { PricingCard } from "./PricingCard";

const pricingPlans = [
  {
    title: "المجاني",
    price: "مجاناً",
    description: "للمطورين المبتدئين",
    features: [
      "100 طلب شهرياً",
      "دعم للغات البرمجة الأساسية",
      "إنشاء كود بسيط",
      "دعم فني محدود",
    ],
    buttonText: "ابدأ مجاناً",
    highlighted: false,
  },
  {
    title: "الاحترافي",
    price: "33 د.ك",
    period: "شهرياً",
    description: "للمطورين المحترفين",
    features: [
      "1000 طلب شهرياً",
      "دعم جميع لغات البرمجة",
      "إنشاء مشاريع متكاملة",
      "تحليل وتحسين الكود",
      "دعم فني ذو أولوية",
      "الوصول إلى القوالب المتقدمة",
    ],
    buttonText: "اشترك الآن",
    highlighted: true,
  },
  {
    title: "المتميز",
    price: "59 د.ك",
    period: "شهرياً",
    description: "للفرق والشركات",
    features: [
      "طلبات غير محدودة",
      "جميع ميزات الخطة الاحترافية",
      "أدوات التعاون الجماعي",
      "تخصيص نماذج الذكاء الاصطناعي",
      "دعم فني متاح 24/7",
      "تدريب وورش عمل مخصصة",
      "إدارة فريق متقدمة",
    ],
    buttonText: "اشترك الآن",
    highlighted: false,
  },
];

export const Pricing = () => {
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto">
        {/* Section header */}
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            اختر الخطة المناسبة لك
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            ابدأ مجاناً أو اختر خطة مدفوعة للحصول على المزيد من الميزات
          </p>
        </div>
        
        {/* Pricing cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <div
              key={index}
              className="animate-scale-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <PricingCard {...plan} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
