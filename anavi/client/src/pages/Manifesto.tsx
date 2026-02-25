import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, Heart, Shield, Target, Users, Sparkles,
  ArrowRight, Quote
} from "lucide-react";

const essays = [
  {
    id: 1,
    title: "Why This Ecosystem Exists",
    subtitle: "The founding thesis behind NAVI",
    icon: Target,
    content: `The private markets are broken. Not in their returns—those remain exceptional for those with access. They're broken in their accessibility, their opacity, and their exclusivity.

For decades, the best opportunities have been reserved for a small circle: the ultra-wealthy, the well-connected, the institutional. Everyone else—including sophisticated operators and investors who could add tremendous value—has been locked out.

NAVI exists to change this equation.

We believe that capital should flow to the best opportunities, not just the most connected ones. We believe that trust is built through transparency, not gatekeeping. We believe that the next generation of wealth creation will come from those who can bridge worlds—operators who understand both the deal and the culture.

This isn't about democratizing access to make a quick buck. It's about building a new infrastructure for private capital—one where alignment, transparency, and cultural context are features, not afterthoughts.

We're not building a marketplace. We're building a trust network.

The difference matters.`,
    readTime: "4 min read",
  },
  {
    id: 2,
    title: "How Capital + Culture Intersect",
    subtitle: "The thesis on aligned investing",
    icon: Heart,
    content: `Capital without culture is just money. Culture without capital is just ideas.

The most transformative investments happen at the intersection—where operators who deeply understand a space meet capital partners who share their vision and values.

This is what we mean by "cultural context."

When we evaluate a deal, we don't just look at the numbers. We look at who is behind it. What is their story? What communities do they serve? What would success mean beyond the financial returns?

This isn't soft thinking—it's rigorous thinking. The best operators are those who understand their market intimately, who have relationships that can't be replicated, who see opportunities that spreadsheets miss.

Our role is to identify these operators, verify their track records, and connect them with capital partners who share their worldview.

We call this "aligned investing."

It means:
• Knowing who you're investing alongside
• Understanding the operator's motivation beyond profit
• Sharing in both the upside and the journey
• Building relationships that extend beyond single transactions

The returns follow from the alignment, not the other way around.

This is why we don't operate a marketplace with thousands of listings. We curate a small number of opportunities where we have deep conviction—where we know the operators, understand the thesis, and often invest our own capital alongside our members.

Quality over quantity. Depth over breadth. Trust over transactions.`,
    readTime: "5 min read",
  },
  {
    id: 3,
    title: "What We Don't Invest In",
    subtitle: "Our principles and boundaries",
    icon: Shield,
    content: `Knowing what you won't do is as important as knowing what you will.

At NAVI, we have clear boundaries. Not because we're moralistic, but because focus requires saying no.

We don't invest in:

**Anything we don't understand**
If we can't explain the value creation thesis in plain language, we pass. Complexity is often a mask for risk.

**Operators without skin in the game**
If the sponsor isn't investing meaningful personal capital alongside LPs, we're skeptical. Alignment matters.

**Deals that require everything to go right**
The best investments have margin for error. If success depends on perfect execution and favorable markets, the risk-adjusted returns aren't there.

**Anything that harms communities**
We won't participate in predatory lending, exploitative labor practices, or environmental destruction. Full stop.

**Get-rich-quick schemes**
If it sounds too good to be true, it is. We're building generational wealth, not chasing overnight returns.

**Deals where we're just capital**
We add value beyond the check—introductions, strategic guidance, operational support. If a deal doesn't want or need that, we're probably not the right partner.

These boundaries aren't constraints—they're features. They allow us to go deep on the opportunities we do pursue, to build real relationships with operators, and to maintain the trust that is our most valuable asset.

When we say yes, it means something.`,
    readTime: "4 min read",
  },
];

export default function Manifesto() {
  return (
    <div className="space-y-8 p-4 md:p-6 max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <Badge variant="outline" className="text-xs">The NAVI Philosophy</Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Manifesto
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            What we believe, why we exist, and the principles that guide every decision we make.
          </p>
        </motion.div>

        {/* Founding Quote */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-sky-500/20">
            <CardContent className="pt-8 pb-8">
              <div className="flex gap-4">
                <Quote className="h-8 w-8 text-sky-500 flex-shrink-0" />
                <div>
                  <p className="text-xl md:text-2xl font-medium italic leading-relaxed">
                    "NAVI gives you vetted access to private deals, operators, and assets — with alignment, transparency, and cultural context."
                  </p>
                  <p className="text-muted-foreground mt-4">— The NAVI Value Proposition</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Core Principles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <Card className="text-center p-6">
            <Users className="h-8 w-8 mx-auto text-sky-500 mb-3" />
            <h3 className="font-semibold">Trust {">"} UX</h3>
            <p className="text-sm text-muted-foreground mt-1">
              We prioritize relationships over features
            </p>
          </Card>
          <Card className="text-center p-6">
            <Target className="h-8 w-8 mx-auto text-sky-500 mb-3" />
            <h3 className="font-semibold">Curation {">"} Scale</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Quality over quantity, always
            </p>
          </Card>
          <Card className="text-center p-6">
            <Sparkles className="h-8 w-8 mx-auto text-sky-500 mb-3" />
            <h3 className="font-semibold">Alignment {">"} Returns</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Shared values create shared success
            </p>
          </Card>
        </motion.div>

        <Separator className="my-8" />

        {/* Essays */}
        <div className="space-y-8">
          {essays.map((essay, index) => (
            <motion.div
              key={essay.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <Card className="overflow-hidden">
                <CardContent className="p-6 md:p-8">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 rounded-lg bg-sky-500/10">
                      <essay.icon className="h-6 w-6 text-sky-500" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{essay.title}</h2>
                      <p className="text-muted-foreground">{essay.subtitle}</p>
                      <Badge variant="outline" className="mt-2 text-xs">
                        <BookOpen className="h-3 w-3 mr-1" />
                        {essay.readTime}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="prose prose-neutral dark:prose-invert max-w-none">
                    {essay.content.split('\n\n').map((paragraph, pIndex) => {
                      if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                        return (
                          <h4 key={pIndex} className="font-semibold text-lg mt-6 mb-2">
                            {paragraph.replace(/\*\*/g, '')}
                          </h4>
                        );
                      }
                      if (paragraph.startsWith('•')) {
                        return (
                          <ul key={pIndex} className="list-disc pl-6 space-y-1">
                            {paragraph.split('\n').map((item, iIndex) => (
                              <li key={iIndex} className="text-muted-foreground">
                                {item.replace('• ', '')}
                              </li>
                            ))}
                          </ul>
                        );
                      }
                      return (
                        <p key={pIndex} className="text-muted-foreground leading-relaxed mb-4">
                          {paragraph}
                        </p>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Closing */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center py-8"
        >
          <p className="text-lg text-muted-foreground mb-4">
            This is what we believe. This is who we are.
          </p>
          <p className="text-2xl font-bold">
            Welcome to NAVI.
          </p>
        </motion.div>
      </div>
  );
}
