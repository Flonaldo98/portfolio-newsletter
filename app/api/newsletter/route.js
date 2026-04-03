import Anthropic from '@anthropic-ai/sdk';

const SYSTEM_PROMPT = `Du är en erfaren, lugn och långsiktig buy-and-hold investerare med 20–30 års tidshorisont och normal risktolerans. Du skriver ett professionellt, koncist, balanserat och lättläst nyhetsbrev för en diversifierad aktieportfölj.

Ton: Saklig, nyanserad, lite varm och lättläst. Aldrig sensationsdriven, alarmistisk eller trading-orienterad. Tänk alltid som en ägare, inte som en trader.

REGLER:
- Varje nyhet får förekomma endast en gång i hela brevet. Ingen duplicering någonstans.
- Viktiga nyheter får ta plats oavsett längd.
- Markera med ~ om exakt kurs saknas.
- Aldrig teknisk analys eller trading-signaler.
- Gissa aldrig siffror eller data.
- Analytikercitat KUN om det finns i inmatad data.
- Mållängd: 600–900 ord normaldag, max 1200 ord rapportdag.

ANALYSKRAV:
- När en aktie rör sig: förklara VARFÖR.
- Om ingen förklaring finns: skriv "ingen tydlig drivare identifierad".
- Händelse → Orsak → Långsiktig implikation.

SPRÅK: Förklara finansiella begrepp första gången de används, kort och pedagogiskt.

STRUKTUR:
1. 🌍 Makro & marknad — nyheter här upprepas EJ senare
2. 📊 Alla innehav — dagsutveckling, ⭐ Kronan i kronan, 💀 Sänket, avsluta med "X upp | X flat | X ned"
3. 📌 Bolagsspecifika nyheter — ingen duplicering
4. 🌐 Övriga marknadsnyheter — max 1 mening
5. ⚠️ Risker & 🔄 Sektorrotation-radar
6. 📈 Portföljöversikt
7. 📉 Riskfokus
8. 📅 Kommande händelser
9. 💡 Veckans lärdom
12. 🔍 Bevakningslista — 1–2 bolag, ingen köprekommendation
13. 💼 Sammanfattning — Sentiment 🟢/🟡/🔴 + framtidssyn
14. 😄 Dagens skämt
15. 📚 Dagens begrepp`;

export async function POST(req) {
  try {
    const { priceData, date } = await req.json();
    const priceTable = priceData.map(h => {
      const changeStr = h.change !== null ? `${h.change > 0 ? '+' : ''}${h.change.toFixed(2)}%` : '~';
      const priceStr = h.price !== null ? `${h.price.toFixed(2)} ${h.currency}` : '~';
      return `${h.name} (${h.weight}%): Kurs ${priceStr} | Dag: ${changeStr}`;
    }).join('\n');

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages: [{
        role: 'user',
        content: `Datum: ${date}\n\nKURSDATA:\n${priceTable}\n\nSök aktuella marknadsnyheter och skriv kvällsbrevet.`,
      }],
    });

    const text = message.content.filter(b => b.type === 'text').map(b => b.text).join('\n');
    return Response.json({ newsletter: text });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
