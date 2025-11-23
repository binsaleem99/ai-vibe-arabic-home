import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface PricingCardProps {
  title: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  buttonText: string;
}

export const PricingCard = ({
  title,
  price,
  period,
  description,
  features,
  highlighted = false,
  buttonText,
}: PricingCardProps) => {
  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-300 hover-lift",
        highlighted
          ? "border-primary shadow-glow scale-105"
          : "border-border hover:border-primary/50"
      )}
    >
      {highlighted && (
        <div className="absolute top-0 left-0 right-0 h-1 gradient-hero" />
      )}
      
      <CardHeader className="text-center pb-8 pt-8">
        <CardTitle className="text-2xl font-bold mb-2">{title}</CardTitle>
        <CardDescription className="text-base">{description}</CardDescription>
        
        <div className="mt-6">
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-5xl font-bold text-foreground">{price}</span>
            {period && <span className="text-muted-foreground text-lg">/ {period}</span>}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6 pb-8">
        <ul className="space-y-4">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                <Check className="w-3 h-3 text-primary" />
              </div>
              <span className="text-foreground text-base leading-relaxed">{feature}</span>
            </li>
          ))}
        </ul>
        
        <Button
          className={cn(
            "w-full h-12 text-base font-semibold transition-all duration-300",
            highlighted
              ? "gradient-hero shadow-md hover:shadow-lg"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          )}
        >
          {buttonText}
        </Button>
      </CardContent>
    </Card>
  );
};
