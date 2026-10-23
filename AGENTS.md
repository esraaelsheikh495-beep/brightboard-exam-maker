<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Read render-visible browser data through `useStoredValue` or post-mount effects so SSR and initial browser markup match.
- Keep exam selection validation in `exam-selection.ts` so manual and random modes honor the same counts and points.
- Keep downloadable exam and bank serialization in `exam-output.ts`; student documents omit answers, and PDF uses the exam page's print layout.
- The existing sign-in and storage are device-local prototypes, not authenticated shared accounts; never claim shared access until Cloud is implemented.
- Store changes emit a browser event and storage errors propagate so navigation, stats and lists remain accurate without false save confirmations.
- Export genuine DOCX with docx and PDF with jsPDF plus per-block browser rendering to preserve multilingual exam layout and safe page breaks.
- Generate a TanStack SPA shell for static Apache delivery; package client assets only and retain the normal Lovable server adapter for publishing.
