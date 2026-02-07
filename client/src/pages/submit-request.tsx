import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ShieldAlert, Send, Mail, Phone, FileText, CheckCircle } from "lucide-react";


export default function SubmitRequest() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [contactEmail, setContactEmail] = useState("support@claimsignal.com");
  
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    serviceType: "",
    carrierName: "",
    claimDescription: "",
    urgency: "normal",
  });

  useEffect(() => {
    fetch('/api/contact-info', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setContactEmail(data.email))
      .catch(() => {});
      
    const params = new URLSearchParams(window.location.search);
    const service = params.get('service');
    if (service) {
      setFormData(prev => ({ ...prev, serviceType: service }));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/service-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSubmitted(true);
        toast({ title: "Success", description: "Your request has been submitted!" });
      } else {
        const data = await res.json();
        toast({ title: "Error", description: data.error || "Failed to submit request", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to submit request", variant: "destructive" });
    }
    setLoading(false);
  };

  const serviceLabels: Record<string, string> = {
    expert_review: "Expert Claim Review",
    carrier_report: "Carrier Intelligence Report",
    training: "Training Session",
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div className="max-w-lg mx-auto py-12">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <CardTitle className="text-white text-2xl">Request Submitted!</CardTitle>
              <CardDescription className="text-slate-400">
                We've received your request and will be in touch soon.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-slate-300">
                You can also reach us directly at:
              </p>
              <a 
                href={`mailto:${contactEmail}`}
                className="flex items-center justify-center gap-2 text-amber-500 hover:text-amber-400"
              >
                <Mail className="h-5 w-5" />
                {contactEmail}
              </a>
              <div className="pt-4">
                <Button
                  onClick={() => setLocation("/")}
                  className="bg-amber-600 hover:bg-amber-500"
                  data-testid="button-back-home"
                >
                  Back to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-2xl mx-auto py-12">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <ShieldAlert className="h-8 w-8 text-amber-500" />
            <h1 className="text-3xl font-bold text-white">ClaimSignal</h1>
          </div>
          <h2 className="text-xl font-semibold text-white">Submit Your Request</h2>
          <p className="text-slate-400 mt-2">
            Tell us about your claim and we'll get started on your service
          </p>
        </div>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Service Request Form
            </CardTitle>
            <CardDescription className="text-slate-400">
              Fill out the form below or email us directly at{" "}
              <a href={`mailto:${contactEmail}`} className="text-amber-500 hover:underline">
                {contactEmail}
              </a>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName" className="text-slate-300">Your Name *</Label>
                  <Input
                    id="customerName"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    required
                    className="bg-slate-700/50 border-slate-600 text-white"
                    placeholder="John Doe"
                    data-testid="input-customer-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerEmail" className="text-slate-300">Email *</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                    required
                    className="bg-slate-700/50 border-slate-600 text-white"
                    placeholder="john@example.com"
                    data-testid="input-customer-email"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerPhone" className="text-slate-300">Phone (Optional)</Label>
                  <Input
                    id="customerPhone"
                    type="tel"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    className="bg-slate-700/50 border-slate-600 text-white"
                    placeholder="(555) 123-4567"
                    data-testid="input-customer-phone"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serviceType" className="text-slate-300">Service Type *</Label>
                  <Select
                    value={formData.serviceType}
                    onValueChange={(value) => setFormData({ ...formData, serviceType: value })}
                    required
                  >
                    <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white" data-testid="select-service-type">
                      <SelectValue placeholder="Select a service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expert_review">Expert Claim Review ($299)</SelectItem>
                      <SelectItem value="carrier_report">Carrier Intelligence Report ($99)</SelectItem>
                      <SelectItem value="training">Training Session ($149)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="carrierName" className="text-slate-300">Insurance Carrier</Label>
                <Input
                  id="carrierName"
                  value={formData.carrierName}
                  onChange={(e) => setFormData({ ...formData, carrierName: e.target.value })}
                  className="bg-slate-700/50 border-slate-600 text-white"
                  placeholder="e.g., State Farm, Allstate, etc."
                  data-testid="input-carrier-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="claimDescription" className="text-slate-300">Describe Your Situation *</Label>
                <Textarea
                  id="claimDescription"
                  value={formData.claimDescription}
                  onChange={(e) => setFormData({ ...formData, claimDescription: e.target.value })}
                  required
                  rows={5}
                  className="bg-slate-700/50 border-slate-600 text-white"
                  placeholder="Tell us about your claim, any challenges you're facing, and what help you need..."
                  data-testid="textarea-description"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="urgency" className="text-slate-300">Urgency</Label>
                <Select
                  value={formData.urgency}
                  onValueChange={(value) => setFormData({ ...formData, urgency: value })}
                >
                  <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white" data-testid="select-urgency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal - Within a few days</SelectItem>
                    <SelectItem value="urgent">Urgent - Need help ASAP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-slate-700/30 p-4 rounded-lg">
                <p className="text-slate-400 text-sm">
                  <strong className="text-slate-300">Have documents to share?</strong><br />
                  After submitting this form, you can email your claim documents, photos, and other files to{" "}
                  <a href={`mailto:${contactEmail}`} className="text-amber-500 hover:underline">
                    {contactEmail}
                  </a>
                </p>
              </div>

              <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-600">
                <p className="text-slate-400 text-xs leading-relaxed">
                  <strong className="text-slate-300">Privacy Notice:</strong> By submitting this form, you consent to ClaimSignal collecting and storing your contact information and claim details. This information will be used solely to provide the requested service and will be securely stored in our database. We will not share your information with third parties without your consent, except as required to fulfill your service request.
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-amber-600 hover:bg-amber-500"
                disabled={loading}
                data-testid="button-submit-request"
              >
                <Send className="mr-2 h-4 w-4" />
                {loading ? "Submitting..." : "Submit Request"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="text-slate-400 hover:text-white"
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
