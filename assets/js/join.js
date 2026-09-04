(() => {
  const form = document.querySelector("#join-form"); if (!form) return;
  const status = document.querySelector("#form-status"); const success = document.querySelector("#application-success"); const submit = form.querySelector("button[type='submit']"); const endpoint = window.AMERICALYS_JOIN_API || "";
  if (!endpoint) { submit.firstChild.textContent = "Applications opening soon "; submit.disabled = true; }
  const setStatus = (message, type = "") => { status.textContent = message; status.className = `form-status ${type}`.trim(); };
  form.addEventListener("submit", async (event) => {
    event.preventDefault(); if (!endpoint) { return; }
    const data = new FormData(form); const clip = data.get("clip");
    if (!clip || !clip.size) { setStatus("Please add a performance clip.", "error"); return; }
    if (!clip.type.startsWith("audio/") && !clip.type.startsWith("video/")) { setStatus("Please choose an audio or video performance clip.", "error"); return; }
    if (clip.size > 10 * 1024 * 1024) { setStatus("Please choose a clip smaller than 10 MB.", "error"); return; }
    submit.disabled = true; setStatus("Uploading your application…", "working");
    try {
      const clipData = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(",")[1]); reader.onerror = reject; reader.readAsDataURL(clip); });
      const payload = {action:"submitApplication",studentName:data.get("studentName"),studentEmail:data.get("studentEmail"),parentName:data.get("parentName"),parentEmail:data.get("parentEmail"),instrument:data.get("instrument"),clipName:clip.name,clipType:clip.type||"application/octet-stream",clipData};
      const response = await fetch(endpoint,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(payload)}); const result = await response.json(); if (!result.ok) throw new Error(result.error||"Submission failed");
      form.hidden = true; success.hidden = false; success.focus();
    } catch (error) { setStatus("We couldn’t send the application. Please try again or email us directly.", "error"); submit.disabled = false; }
  });
})();
