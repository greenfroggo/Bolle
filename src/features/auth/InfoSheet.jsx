import React from "react";
import { Hand, Orbit, Circle, Plus, VenetianMask, Trophy } from "lucide-react";
import Sheet from "../../components/Sheet.jsx";
import useEscape from "../../hooks/useEscape.js";
import ReportProblemButton from "./ReportProblemButton.jsx";

/* Finestra "Come funziona" */
export default function InfoSheet({ me, onClose, onTutorial }) {
  useEscape(onClose);
  const daily = me?.daily_limit ?? "–";
  const bonus = me?.bonus_per_post ?? 2;

  const rows = [
    [<Hand key="hand" />, "Tocca per scoppiare", "Scegli una bolla e toccala per scoprire cosa nasconde. Puoi anche trascinarla."],
    [<Orbit key="orbit" />, "Magnetismo delle Bolle", "Le bolle si muovono e si attraggono come piccoli corpi magnetici. Attiva «Vicino a me» per esplorare quelle pubblicate nei tuoi dintorni: più bolle ci sono nella zona, più incontri e sorprese puoi scoprire. La posizione esatta non viene mostrata agli altri."],
    [<Circle key="circle" />, `${daily} scoppi al giorno`, "Ogni giorno hai a disposizione un numero di bolle da aprire. Una bolla scoppiata non si riapre."],
    [<Plus key="plus" />, `Pubblica e ottieni +${bonus}`, `Quando finiscono, crea una tua bolla: ogni pubblicazione ti regala ${bonus} scoppi extra.`],
    [<VenetianMask key="mask" />, "Tutto anonimo", "Gli altri vedono solo il tuo username generato automaticamente, mai i tuoi dati."],
    [<Trophy key="trophy" />, "Classifiche", "Più aperture ricevono le tue bolle, più sali in classifica. Le trovi nella home."],
    [<span key="heart">💜</span>, "Reazioni Segrete", "Puoi reagire alle bolle con un'emozione. L'autore riceve una notifica senza conoscere l'identità di chi ha reagito."],
    [<span key="pin">📍</span>, "Vicino a me", "Scegli una distanza per scoprire le bolle disponibili nei dintorni. La posizione non è mostrata agli altri."],
    [<span key="star">🌟</span>, "Bolle rare", "Circa una bolla su venti è rara: la riconosci dal bordo dorato e dall'etichetta RARA. La rarità è assegnata dal sistema in modo casuale, in base all'identificativo della bolla: non si può scegliere né comprare. Se la scoppi ricevi scoppi bonus extra (di norma 3), che si sommano a quelli del giorno."],
    [<span key="palette">🎨</span>, "Il colore dice cosa c'è dentro", "Il bordo della bolla cambia colore in base al contenuto: azzurro foto e video, verde acqua GIF, ambra sondaggi, rosa domande, giallo meme, celeste pensieri, viola confessioni, turchese «2 verità e 1 bugia», arancio voti. Le capsule del tempo restano un mistero finché il timer non arriva a zero."],
    [<span key="masks">🎭</span>, "Tanti tipi di bolla", "Oltre a foto e video puoi pubblicare GIF e meme, pensieri, confessioni, sondaggi (anche tra due foto), domande, «2 verità e 1 bugia» e bolle da votare. Con la capsula del tempo scegli quando si apre la tua bolla."],
  ];

  return (
    <Sheet label="Come funziona BOLLE" onClose={onClose} title="Come funziona" subtitle="Piccoli momenti, grandi sorprese.">
      <button type="button" className="bl-tutorial-entry" onClick={onTutorial}>
        <span aria-hidden="true">📖</span>
        <span>
          <strong>Scopri Bolle · Tutorial</strong>
          <small>Una guida interattiva per iniziare, passo dopo passo</small>
        </span>
        <span aria-hidden="true">›</span>
      </button>
      <ul className="bl-how">
        {rows.map(([i, t, d]) => (
          <li key={t}>
            <span aria-hidden="true">{i}</span>
            <div>
              <strong>{t}</strong>
              <p>{d}</p>
            </div>
          </li>
        ))}
      </ul>
      <ReportProblemButton context="Come funziona: problema segnalato dall'utente" label="Qualcosa non funziona? Segnala agli sviluppatori" />
      <button type="button" className="bl-cta" onClick={onClose}>
        Ho capito
      </button>
    </Sheet>
  );
}