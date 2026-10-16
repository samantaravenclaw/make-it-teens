// Небольшое поведение формы-примера. Реальную отправку нужно подключить отдельно.
const form = document.querySelector("#contact-form");
const message = document.querySelector("#form-message");

// Орёл из анимированного WebP делает петлю и садится вместо буквы «О».
function playEagleFlight() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const logoLetter = document.querySelector(".site-header .logo-eagle-slot");
  if (!logoLetter) return;

  const flight = document.createElement("div");
  flight.className = "eagle-flight";
  flight.setAttribute("aria-hidden", "true");
  flight.innerHTML = '<img class="eagle" src="assets/eagle-still.png" alt="">';
  document.body.append(flight);

  const width = 104;
  const height = width * 2 / 3;
  const target = logoLetter.getBoundingClientRect();
  const startX = window.innerWidth - width - 18;
  const startY = window.innerHeight - height - 12;
  const loopX = window.innerWidth * 0.57;
  const loopY = window.innerHeight * 0.5;
  const loopRadiusX = Math.min(window.innerWidth * 0.28, 300);
  const loopRadiusY = Math.min(window.innerHeight * 0.37, 270);
  const landedScale = Math.max(16, target.width * 1.45) / width;
  flight.style.width = `${width}px`;
  const start = { x: startX + width / 2, y: startY + height / 2 };
  const landing = { x: target.left + target.width / 2, y: target.top + target.height / 2 };
  const right = { x: loopX + loopRadiusX, y: loopY };
  const top = { x: loopX, y: loopY - loopRadiusY };
  const left = { x: loopX - loopRadiusX, y: loopY };
  const bottom = { x: loopX, y: loopY + loopRadiusY };
  const curve = (from, control1, control2, to, t) => {
    const u = 1 - t;
    return {
      x: u ** 3 * from.x + 3 * u ** 2 * t * control1.x + 3 * u * t ** 2 * control2.x + t ** 3 * to.x,
      y: u ** 3 * from.y + 3 * u ** 2 * t * control1.y + 3 * u * t ** 2 * control2.y + t ** 3 * to.y
    };
  };
  const handle = 0.5523;
  const approach = [start, { x: start.x - 20, y: start.y - height * 1.5 }, { x: right.x, y: right.y + loopRadiusY * handle }, right];
  const loop = [
    [right, { x: right.x, y: right.y - loopRadiusY * handle }, { x: loopX + loopRadiusX * handle, y: top.y }, top],
    [top, { x: loopX - loopRadiusX * handle, y: top.y }, { x: left.x, y: loopY - loopRadiusY * handle }, left],
    [left, { x: left.x, y: loopY + loopRadiusY * handle }, { x: loopX - loopRadiusX * handle, y: bottom.y }, bottom],
    [bottom, { x: loopX + loopRadiusX * handle, y: bottom.y }, { x: right.x, y: loopY + loopRadiusY * handle }, right]
  ];
  const exit = [right, { x: right.x, y: right.y - loopRadiusY * handle }, { x: landing.x - loopRadiusX * 0.35, y: landing.y + loopRadiusY * 0.45 }, landing];
  const route = [approach, ...loop, exit];

  // Sample the smooth Bezier curves at even distances for a steady, gliding speed.
  const densePath = [];
  for (const segment of route) {
    for (let step = densePath.length ? 1 : 0; step <= 40; step += 1) {
      densePath.push(curve(...segment, step / 40));
    }
  }
  const distances = [0];
  for (let index = 1; index < densePath.length; index += 1) {
    const dx = densePath[index].x - densePath[index - 1].x;
    const dy = densePath[index].y - densePath[index - 1].y;
    distances.push(distances[index - 1] + Math.hypot(dx, dy));
  }
  const totalDistance = distances[distances.length - 1];
  const loopDistance = distances[40 + loop.length * 40] - distances[40];
  const duration = 8000 * totalDistance / (totalDistance + loopDistance);
  const keyframes = [];
  let pathIndex = 1;
  const frameCount = 200;
  for (let frame = 0; frame <= frameCount; frame += 1) {
    const progress = frame / frameCount;
    const wantedDistance = totalDistance * progress;
    while (pathIndex < distances.length - 1 && distances[pathIndex] < wantedDistance) pathIndex += 1;
    const previousDistance = distances[pathIndex - 1];
    const segmentLength = distances[pathIndex] - previousDistance || 1;
    const blend = (wantedDistance - previousDistance) / segmentLength;
    const position = {
      x: densePath[pathIndex - 1].x + (densePath[pathIndex].x - densePath[pathIndex - 1].x) * blend,
      y: densePath[pathIndex - 1].y + (densePath[pathIndex].y - densePath[pathIndex - 1].y) * blend
    };
    const scale = progress < 0.08
      ? 0.52 + (0.86 - 0.52) * progress / 0.08
      : progress > 0.92
        ? 0.86 + (landedScale - 0.86) * (progress - 0.92) / 0.08
        : 0.86 + 0.14 * Math.sin((progress - 0.08) / 0.84 * Math.PI);
    keyframes.push({
      left: `${position.x - width / 2}px`,
      top: `${position.y - height / 2}px`,
      transform: `scale(${scale})`,
      opacity: Math.min(1, progress * 24),
      offset: progress,
      easing: "linear"
    });
  }

  const animation = flight.animate(keyframes, { duration, easing: "linear", fill: "forwards" });

  let lastSparkAt = 0;
  const scatterStars = (now) => {
    if (now - lastSparkAt >= 70 && animation.playState === "running") {
      lastSparkAt = now;
      const bounds = flight.getBoundingClientRect();
      const starCount = Math.random() < 0.28 ? 2 : 1;
      for (let index = 0; index < starCount; index += 1) {
        const star = document.createElement("span");
        star.className = "eagle-spark";
        star.textContent = Math.random() < 0.35 ? "✧" : "✦";
        const startX = bounds.left + bounds.width * (0.35 + Math.random() * 0.3);
        const startY = bounds.top + bounds.height * (0.25 + Math.random() * 0.5);
        const driftX = (Math.random() - 0.5) * 86;
        const driftY = (Math.random() - 0.5) * 86;
        const size = 7 + Math.random() * 10;
        const spin = `${Math.round((Math.random() - 0.5) * 150)}deg`;
        const lifetime = 650 + Math.random() * 600;

        star.style.left = `${startX}px`;
        star.style.top = `${startY}px`;
        star.style.fontSize = `${size}px`;
        document.body.append(star);
        const sparkle = star.animate([
          { opacity: 0, transform: "translate(-50%, -50%) scale(.15) rotate(0deg)" },
          { opacity: 0.95, offset: 0.16, transform: "translate(-50%, -50%) scale(1) rotate(25deg)" },
          { opacity: 0, transform: `translate(calc(-50% + ${driftX}px), calc(-50% + ${driftY}px)) scale(.2) rotate(${spin})` }
        ], { duration: lifetime, easing: "ease-out", fill: "forwards" });
        sparkle.onfinish = () => star.remove();
      }
    }

    if (animation.playState !== "finished" && animation.playState !== "idle") requestAnimationFrame(scatterStars);
  };
  requestAnimationFrame(scatterStars);

  animation.onfinish = () => {
    const logoBounds = logoLetter.getBoundingClientRect();
    const burstX = logoBounds.left + logoBounds.width / 2;
    const burstY = logoBounds.top + logoBounds.height / 2;
    const burstCount = 24;

    for (let index = 0; index < burstCount; index += 1) {
      const star = document.createElement("span");
      star.className = "eagle-spark";
      star.textContent = index % 3 === 0 ? "✧" : "✦";
      const angle = (Math.PI * 2 * index) / burstCount + (Math.random() - 0.5) * 0.24;
      const distance = 54 + Math.random() * 92;
      const driftX = Math.cos(angle) * distance;
      const driftY = Math.sin(angle) * distance;
      const spin = `${Math.round((Math.random() - 0.5) * 180)}deg`;
      const size = 9 + Math.random() * 10;
      const lifetime = 900 + Math.random() * 500;

      star.style.left = `${burstX}px`;
      star.style.top = `${burstY}px`;
      star.style.fontSize = `${size}px`;
      document.body.append(star);
      const sparkle = star.animate([
        { opacity: 0, transform: "translate(-50%, -50%) scale(.12) rotate(0deg)" },
        { opacity: 1, offset: 0.14, transform: "translate(-50%, -50%) scale(1.15) rotate(30deg)" },
        { opacity: 0, transform: `translate(calc(-50% + ${driftX}px), calc(-50% + ${driftY}px)) scale(.16) rotate(${spin})` }
      ], { duration: lifetime, delay: Math.random() * 110, easing: "cubic-bezier(.16,.7,.3,1)", fill: "forwards" });
      sparkle.onfinish = () => star.remove();
    }

    flight.classList.add("eagle-perched");
    logoLetter.classList.add("eagle-replaced");
  };
}

playEagleFlight();

const magicCursor = document.createElement("span");
magicCursor.className = "magic-cursor-star";
magicCursor.setAttribute("aria-hidden", "true");
magicCursor.textContent = "✦";
document.body.append(magicCursor);

const hasFinePointer = window.matchMedia("(pointer: fine)").matches;
if (hasFinePointer) {
  document.documentElement.classList.add("magic-cursor-enabled");

  document.addEventListener("pointermove", (event) => {
    if (event.pointerType === "touch") return;
    magicCursor.style.left = `${event.clientX}px`;
    magicCursor.style.top = `${event.clientY}px`;
    magicCursor.classList.add("is-visible");
  });

  document.addEventListener("pointerout", (event) => {
    if (!event.relatedTarget) magicCursor.classList.remove("is-visible");
  });

}

document.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;

  const sparkleCount = 24;
  for (let index = 0; index < sparkleCount; index += 1) {
    const sparkle = document.createElement("span");
    sparkle.className = "eagle-spark click-spark";
    sparkle.textContent = index % 3 === 0 ? "✧" : "✦";
    const angle = (Math.PI * 2 * index) / sparkleCount + (Math.random() - 0.5) * 0.35;
    const distance = 34 + Math.random() * 72;
    const driftX = Math.cos(angle) * distance;
    const driftY = Math.sin(angle) * distance;
    sparkle.style.left = `${event.clientX}px`;
    sparkle.style.top = `${event.clientY}px`;
    sparkle.style.fontSize = `${8 + Math.random() * 8}px`;
    document.body.append(sparkle);

    const animation = sparkle.animate([
      { opacity: 0, transform: "translate(-50%, -50%) scale(.15) rotate(0deg)" },
      { opacity: 1, offset: 0.18, transform: "translate(-50%, -50%) scale(1) rotate(25deg)" },
      { opacity: 0, transform: `translate(calc(-50% + ${driftX}px), calc(-50% + ${driftY}px)) scale(.15) rotate(100deg)` }
    ], { duration: 620 + Math.random() * 300, easing: "ease-out", fill: "forwards" });
    animation.onfinish = () => sparkle.remove();
  }
});

const musicToggle = document.querySelector("#music-toggle");
const musicClose = document.querySelector("#music-close");
const musicPanel = document.querySelector("#music-panel");
const musicFrame = musicPanel?.querySelector("iframe");

function setMusicPanelOpen(open) {
  if (!musicToggle || !musicPanel || !musicFrame) return;
  musicPanel.hidden = !open;
  musicToggle.setAttribute("aria-expanded", String(open));
  if (open) musicFrame.src = musicFrame.dataset.src;
  else musicFrame.removeAttribute("src"); // Останавливает трек при закрытии плеера.
}

musicToggle?.addEventListener("click", () => {
  setMusicPanelOpen(musicToggle.getAttribute("aria-expanded") !== "true");
});
musicClose?.addEventListener("click", () => setMusicPanelOpen(false));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setMusicPanelOpen(false);
});

if (form && message) {
  const houseInfo = {
    gryffindor: { name: "Гриффиндор", traits: "смелость, решительность и готовность защищать то, что считаешь правильным" },
    hufflepuff: { name: "Пуффендуй", traits: "верность, справедливость, терпение и забота о других" },
    ravenclaw: { name: "Когтевран", traits: "любознательность, острый ум, творчество и любовь к новым идеям" },
    slytherin: { name: "Слизерин", traits: "амбиции, находчивость, целеустремлённость и умение выбирать стратегию" }
  };
  const submitButton = form.querySelector('button[type="submit"]');
  const originalButtonText = submitButton.innerHTML;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const answers = [...form.querySelectorAll('input[type="radio"]:checked')];
    const scores = Object.fromEntries(Object.keys(houseInfo).map((house) => [house, 0]));
    answers.forEach((answer) => { scores[answer.value] += 1; });

    const highestScore = Math.max(...Object.values(scores));
    const tiedHouses = Object.keys(scores).filter((house) => scores[house] === highestScore);
    // Если очки равны, решает ответ на последний вопрос среди тех, что разделили первое место.
    const winner = tiedHouses.length === 1
      ? tiedHouses[0]
      : [...answers].reverse().find((answer) => tiedHouses.includes(answer.value)).value;
    const result = houseInfo[winner];
    const tieNote = tiedHouses.length > 1
      ? `<p class="quiz-result-tie">У нескольких факультетов оказалось поровну очков — решающим стал твой последний ответ, совпавший с лидирующими факультетами.</p>`
      : "";

    message.innerHTML = `<strong class="quiz-result-title">Твой факультет — ${result.name}!</strong><span>Твои сильные стороны: ${result.traits}.</span>${tieNote}<p class="quiz-result-tie">Это игровой тест по выбранным ответам, а не официальное распределение.</p>`;
    message.hidden = false;
    message.setAttribute("role", "status");
    submitButton.textContent = "Пройти ещё раз";
    message.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });

  submitButton.addEventListener("click", (event) => {
    if (message.hidden) return;
    event.preventDefault();
    form.reset();
    message.hidden = true;
    submitButton.innerHTML = originalButtonText;
  });
}
