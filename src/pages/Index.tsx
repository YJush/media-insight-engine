import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArticleAnalysis } from "@/components/ArticleAnalysis";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search, Shield, TrendingUp, Target } from "lucide-react";

const Index = () => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const analyzeArticle = async () => {
    if (!url.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a valid article URL",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("analyze-article", {
        body: { url },
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: "Analysis Error",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      setResult(data);
      toast({
        title: "Analysis Complete",
        description: "Article has been analyzed successfully",
      });
    } catch (error: any) {
      console.error("Analysis error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to analyze article",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      analyzeArticle();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Hero Section */}
      <div className="container max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-4">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">AI-Powered Media Intelligence</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent leading-tight">
            Decode Media Bias
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Analyze news articles for bias, tone, and business impact. Make informed decisions with AI-powered insights.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="p-6 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)] transition-shadow">
            <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4">
              <Search className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Claim Extraction</h3>
            <p className="text-sm text-muted-foreground">
              Automatically identify key claims and statements from articles
            </p>
          </Card>

          <Card className="p-6 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)] transition-shadow">
            <div className="p-3 bg-secondary/10 rounded-lg w-fit mb-4">
              <TrendingUp className="w-6 h-6 text-secondary" />
            </div>
            <h3 className="font-semibold mb-2">Bias Detection</h3>
            <p className="text-sm text-muted-foreground">
              Detect tone, framing, and ideological bias in media content
            </p>
          </Card>

          <Card className="p-6 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)] transition-shadow">
            <div className="p-3 bg-accent/10 rounded-lg w-fit mb-4">
              <Target className="w-6 h-6 text-accent" />
            </div>
            <h3 className="font-semibold mb-2">Impact Analysis</h3>
            <p className="text-sm text-muted-foreground">
              Predict business risks and get actionable recommendations
            </p>
          </Card>
        </div>

        {/* Input Section */}
        <Card className="p-8 shadow-[var(--shadow-elevated)] mb-8">
          <div className="space-y-4">
            <label className="text-sm font-medium">Article URL</label>
            <div className="flex gap-3">
              <Input
                placeholder="https://example.com/article..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                className="text-base"
              />
              <Button 
                onClick={analyzeArticle} 
                disabled={loading}
                size="lg"
                className="px-8 bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Analyze
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Enter any news article URL to analyze its claims, bias, and potential business impact
            </p>
          </div>
        </Card>

        {/* Results */}
        {result && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Analysis Results</h2>
            <ArticleAnalysis result={result} />
          </div>
        )}

        {/* Disclaimer */}
        <Card className="p-4 mt-8 bg-info/5 border-info/30">
          <p className="text-sm text-muted-foreground text-center">
            <strong>Disclaimer:</strong> Analysis results are AI-generated and probabilistic. They should be used as advisory insights, not deterministic facts. Always verify critical information independently.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default Index;
