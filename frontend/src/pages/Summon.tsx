import { useState } from "react";
import { Sparkles, Cookie, Star, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/providers/trpc";
import { Agent } from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function Summon() {
  const utils = trpc.useUtils();
  const { data: wallet, isLoading: walletLoading } = trpc.llm.wallet.get.useQuery();
  const [isRevealing, setIsRevealing] = useState(false);
  const [summonedAgent, setSummonedAgent] = useState<Agent | null>(null);
  const [revealStage, setRevealStage] = useState<'idle' | 'pulling' | 'glowing' | 'revealed'>('idle');

  const summonMutation = trpc.llm.gacha.summon.useMutation({
    onSuccess: (agent) => {
      setSummonedAgent(agent as Agent);
      setRevealStage('glowing');
      utils.llm.wallet.get.invalidate();
      utils.llm.agents.list.invalidate();
    },
    onError: (err) => {
      toast.error(err.message);
      setRevealStage('idle');
      setIsRevealing(false);
    }
  });

  const handleSummon = () => {
    if ((wallet?.cookies ?? 0) < 50) {
      toast.error("Not enough cookies!");
      return;
    }
    setIsRevealing(true);
    setRevealStage('pulling');
    setSummonedAgent(null);
    
    // Artificial delay for suspense
    setTimeout(() => {
      summonMutation.mutate();
    }, 1500);
  };

  const getRarityColor = (rarity: number) => {
    if (rarity === 5) return "from-amber-400 to-yellow-600 shadow-[0_0_30px_rgba(251,191,36,0.5)]";
    if (rarity === 4) return "from-purple-400 to-fuchsia-600 shadow-[0_0_25px_rgba(192,38,211,0.4)]";
    return "from-blue-400 to-cyan-600 shadow-[0_0_20px_rgba(34,211,238,0.3)]";
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tighter flex items-center justify-center gap-3">
          <Sparkles className="w-8 h-8 text-amber-400" />
          Summoning Portal
          <Sparkles className="w-8 h-8 text-amber-400" />
        </h1>
        <p className="text-muted-foreground">Spend 50 cookies to manifest a new AI Persona</p>
      </div>

      <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-full border border-primary/20">
        <Cookie className="w-5 h-5 text-amber-500" />
        <span className="font-bold text-lg">{walletLoading ? "..." : wallet?.cookies}</span>
        <span className="text-xs text-muted-foreground uppercase tracking-widest ml-1">Cookies</span>
      </div>

      <div className="relative w-72 h-96 group perspective-1000">
        {revealStage === 'idle' && (
          <div className="absolute inset-0 rounded-2xl border-2 border-dashed border-primary/20 flex flex-col items-center justify-center bg-muted/10">
            <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center mb-4">
              <HelpCircle className="w-10 h-10 text-primary/20" />
            </div>
            <span className="text-sm text-muted-foreground font-medium">Portal Offline</span>
          </div>
        )}

        {(revealStage === 'pulling' || revealStage === 'glowing') && (
          <div className={cn(
            "absolute inset-0 rounded-2xl bg-gradient-to-br border-4 border-white/10 animate-pulse transition-all duration-1000",
            revealStage === 'glowing' ? getRarityColor(summonedAgent?.rarity ?? 3) : "from-gray-700 to-gray-900"
          )}>
            <div className="absolute inset-0 flex items-center justify-center">
               <div className="w-32 h-32 rounded-full bg-white/10 animate-ping" />
            </div>
          </div>
        )}

        {revealStage === 'revealed' && summonedAgent && (
          <div className={cn(
            "absolute inset-0 rounded-2xl bg-gradient-to-br p-1 shadow-2xl animate-in zoom-in-95 duration-500",
            getRarityColor(summonedAgent.rarity)
          )}>
            <div className="h-full w-full bg-background rounded-[calc(1rem-1px)] p-6 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-0.5">
                  {Array.from({ length: summonedAgent.rarity }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  {summonedAgent.provider}
                </span>
              </div>
              
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center border-4 border-primary/10 overflow-hidden">
                   {/* This would be the AI generated anime girl portrait */}
                   <span className="text-4xl">👧</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold">{summonedAgent.name}</h3>
                  <p className="text-xs text-primary font-semibold uppercase tracking-tighter">{summonedAgent.title}</p>
                </div>
                <div className="w-full bg-muted/50 rounded-md p-3 text-xs italic text-muted-foreground">
                  "{summonedAgent.trait}"
                </div>
              </div>

              <Button variant="outline" className="mt-4 w-full" onClick={() => setRevealStage('idle')}>
                Done
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-4">
        {revealStage === 'idle' ? (
           <Button 
            size="lg" 
            className="px-12 py-6 text-xl font-bold shadow-lg hover:shadow-primary/20 transition-all"
            onClick={handleSummon}
            disabled={summonMutation.isPending || (wallet?.cookies ?? 0) < 50}
          >
            Summon (50 🍪)
          </Button>
        ) : revealStage === 'glowing' ? (
          <Button 
            size="lg" 
            variant="secondary"
            className="px-12 py-6 text-xl font-bold animate-bounce"
            onClick={() => setRevealStage('revealed')}
          >
            Reveal!
          </Button>
        ) : null}
      </div>
    </div>
  );
}
