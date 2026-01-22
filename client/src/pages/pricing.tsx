import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Check, Loader2, ShieldAlert } from "lucide-react";

interface Price {
  id: string;
  unit_amount: number;
  currency: string;
  recurring: { interval: string } | null;
}

interface Product {
  id: string;
  name: string;
  description: string;
  prices: Price[];
}

export default function Pricing() {
  const [, setLocation] = useLocation();
  const { authenticated, userType, needsSubscription, refreshSession } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/stripe/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data.products || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        toast({ title: "Error", description: "Failed to load pricing", variant: "destructive" });
      });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    if (sessionId) {
      fetch(`/api/stripe/verify-subscription?session_id=${sessionId}`, { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            refreshSession();
            toast({ title: "Success", description: "Your subscription is now active!" });
            setLocation("/");
          }
        });
    }
  }, []);

  const handleCheckout = async (priceId: string) => {
    if (!authenticated) {
      setLocation("/login");
      return;
    }

    if (userType === 'team') {
      toast({ title: "Team accounts", description: "Team accounts don't require a subscription.", variant: "default" });
      setLocation("/");
      return;
    }

    setCheckoutLoading(priceId);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
        credentials: 'include',
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast({ title: "Error", description: data.error || "Failed to start checkout", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to start checkout", variant: "destructive" });
    }
    setCheckoutLoading(null);
  };

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const features = [
    "Full access to adjuster database",
    "Claim tracking & analytics",
    "Carrier intelligence reports",
    "Document management",
    "AI tactical advisor",
    "Unlimited searches",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto py-12">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <ShieldAlert className="h-8 w-8 text-amber-500" />
            <h1 className="text-3xl font-bold text-white">ClaimSignal</h1>
          </div>
          <h2 className="text-2xl font-semibold text-white mb-2">Choose Your Plan</h2>
          <p className="text-slate-400">Get full access to ClaimSignal's powerful tools</p>
        </div>

        {loading ? (
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          </div>
        ) : products.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700 max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-white">Pro Access</CardTitle>
              <CardDescription className="text-slate-400">
                Full access to all features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300 mb-4">
                Subscription products are being configured. Please check back soon.
              </p>
              <ul className="space-y-2">
                {features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-slate-300">
                    <Check className="h-4 w-4 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={() => setLocation("/login")}
                className="w-full bg-amber-600 hover:bg-amber-500"
                data-testid="button-back-login"
              >
                Back to Login
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Card key={product.id} className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">{product.name}</CardTitle>
                  <CardDescription className="text-slate-400">
                    {product.description || "Full access to all features"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {product.prices.map((price) => (
                    <div key={price.id} className="mb-4">
                      <div className="text-3xl font-bold text-white">
                        {formatPrice(price.unit_amount, price.currency)}
                        {price.recurring && (
                          <span className="text-lg font-normal text-slate-400">
                            /{price.recurring.interval}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  <ul className="space-y-2 mt-4">
                    {features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-slate-300 text-sm">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  {product.prices[0] && (
                    <Button
                      onClick={() => handleCheckout(product.prices[0].id)}
                      className="w-full bg-amber-600 hover:bg-amber-500"
                      disabled={checkoutLoading === product.prices[0].id}
                      data-testid={`button-checkout-${product.id}`}
                    >
                      {checkoutLoading === product.prices[0].id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Subscribe Now
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        <div className="text-center mt-8">
          <Button
            variant="ghost"
            onClick={() => setLocation("/login")}
            className="text-slate-400 hover:text-white"
            data-testid="button-back"
          >
            Back to Login
          </Button>
        </div>
      </div>
    </div>
  );
}
