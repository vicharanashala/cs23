import { useEffect } from 'react';

interface JsonLdProps {
  faqs?: Array<{ question: string; answer: string }>;
}

const DEFAULT_FAQS = [
  { question: "What is the Samagama Internship Program?", answer: "A structured internship at Vicharanashala Lab, IIT Ropar offering real-world AI, web, and research project experience." },
  { question: "How do I apply?", answer: "Visit samagama.in and follow the application process outlined on the internship portal." },
  { question: "What is the stipend amount?", answer: "The stipend details are provided in the offer letter after selection. Contact the coordinator for specific queries." },
];

export function FAQJsonLd({ faqs = DEFAULT_FAQS }: JsonLdProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer,
      }
    }))
  };

  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(schema);
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, []);

  return null;
}