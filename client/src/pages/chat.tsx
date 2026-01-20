import { useState, useRef, useEffect } from "react";
import { Layout } from "@/components/layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Bot, User, Sparkles, Loader2, StopCircle, ThumbsUp, ThumbsDown, Copy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "I am your claims intelligence assistant. I can analyze adjuster profiles, suggest negotiation strategies, or draft correspondence. How can I help you today?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Simulate AI delay and response
    setTimeout(() => {
      const responses = [
        "Based on the adjuster's profile, I recommend avoiding early settlement offers. They have a pattern of low-balling initial claims.",
        "I've analyzed the correspondence. The adjuster is using standard delay tactics. Here is a draft response to push for a timeline...",
        "That carrier typically responds well to detailed medical chronologies. Ensure you have highlighted the gap in treatment with a valid reason.",
        "The risk profile for this adjuster is 'Severe'. Proceed with caution and document every phone call immediately.",
        "I can help you draft a demand letter. What are the key injuries and total medical specials?"
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: randomResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500 + Math.random() * 2000); // Random delay 1.5s - 3.5s
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      description: "Message copied to clipboard",
      duration: 2000,
    });
  };

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-4rem)] max-w-4xl mx-auto p-4 md:p-6 w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/40">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Bot className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                Tactical Advisor
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-mono uppercase tracking-wider">Beta</span>
              </h1>
              <p className="text-xs text-muted-foreground">Powered by Claims Intelligence Engine</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="hidden sm:flex gap-2 text-muted-foreground" onClick={() => setMessages([])}>
            <Sparkles className="w-4 h-4" />
            New Session
          </Button>
        </div>

        {/* Chat Area */}
        <ScrollArea className="flex-1 pr-4 -mr-4 mb-4">
          <div className="space-y-6 pb-4">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <Avatar className={`w-8 h-8 md:w-10 md:h-10 border ${msg.role === "assistant" ? "bg-primary/10 border-primary/20" : "bg-muted border-border"}`}>
                  {msg.role === "assistant" ? (
                    <div className="w-full h-full flex items-center justify-center">
                       <Bot className="w-5 h-5 text-primary" />
                    </div>
                  ) : (
                    <AvatarImage src="https://github.com/shadcn.png" />
                  )}
                  <AvatarFallback>{msg.role === "assistant" ? "AI" : "ME"}</AvatarFallback>
                </Avatar>

                <div className={`flex flex-col max-w-[80%] md:max-w-[70%] space-y-2 ${msg.role === "user" ? "items-end" : "items-start"}`}>
                  <div 
                    className={`p-4 rounded-2xl shadow-sm text-sm md:text-base leading-relaxed whitespace-pre-wrap ${
                      msg.role === "user" 
                        ? "bg-primary text-primary-foreground rounded-tr-none" 
                        : "bg-card border border-border/50 rounded-tl-none"
                    }`}
                  >
                    {msg.content}
                  </div>
                  
                  {msg.role === "assistant" && (
                    <div className="flex items-center gap-2 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={() => copyToClipboard(msg.content)}>
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground">
                        <ThumbsUp className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground">
                        <ThumbsDown className="w-3 h-3" />
                      </Button>
                      <span className="text-[10px] text-muted-foreground ml-2">
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}

            {isTyping && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-4"
              >
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
                <div className="bg-card border border-border/50 p-4 rounded-2xl rounded-tl-none flex items-center gap-1 min-w-[60px]">
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1] }} 
                    transition={{ repeat: Infinity, duration: 1, ease: "easeInOut", delay: 0 }}
                    className="w-2 h-2 rounded-full bg-primary/40" 
                  />
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1] }} 
                    transition={{ repeat: Infinity, duration: 1, ease: "easeInOut", delay: 0.2 }}
                    className="w-2 h-2 rounded-full bg-primary/40" 
                  />
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1] }} 
                    transition={{ repeat: Infinity, duration: 1, ease: "easeInOut", delay: 0.4 }}
                    className="w-2 h-2 rounded-full bg-primary/40" 
                  />
                </div>
              </motion.div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="relative mt-auto pt-2">
          <div className="relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about negotiation tactics, claim strategy, or draft a response..."
              className="w-full min-h-[60px] max-h-[180px] p-4 pr-12 bg-muted/50 border border-border/50 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all text-sm md:text-base scrollbar-hide"
              rows={1}
            />
            <div className="absolute right-2 bottom-2">
              <Button 
                size="icon" 
                className={`h-9 w-9 transition-all ${input.trim() ? "opacity-100" : "opacity-50"}`} 
                disabled={!input.trim() || isTyping}
                onClick={handleSend}
              >
                {isTyping ? <StopCircle className="w-4 h-4" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          <p className="text-center text-[10px] text-muted-foreground mt-2">
            AI can make mistakes. Verify important information.
          </p>
        </div>
      </div>
    </Layout>
  );
}
