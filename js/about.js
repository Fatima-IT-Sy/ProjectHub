// About Us page: team picture, numbers, and scroll animations

function setupAboutPage() {
  const stage = document.getElementById("teamStage");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canAnimate = !reduceMotion && "IntersectionObserver" in window;

  showAboutButtons();

  // Show everything at once if the browser can't animate or the user prefers less motion
  if (!canAnimate) {
    stage.classList.add("connected");
    document.querySelectorAll(".reveal").forEach(function (item) {
      item.classList.add("visible");
    });
    drawTeamLines();
    window.addEventListener("resize", drawTeamLines);
    return;
  }

  // The team starts empty and connects when it comes into view
  stage.classList.add("waiting");
  drawTeamLines();
  window.addEventListener("resize", drawTeamLines);

  const stageObserver = new IntersectionObserver(function (entries) {
    if (entries[0].isIntersecting) {
      connectTeam();
      stageObserver.disconnect();
    }
  }, { threshold: 0.35 });
  stageObserver.observe(stage);

  // Fade in each part when it comes into view
  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        countUp(entry.target.querySelector("[data-count]"));
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  document.querySelectorAll(".reveal").forEach(function (item) {
    observer.observe(item);
  });
}

// Buttons at the end change if the user is logged in
function showAboutButtons() {
  const user = getCurrentUser();
  const box = document.getElementById("aboutButtons");

  if (isAdmin(user)) {
    box.innerHTML = '<a class="btn btn-primary" href="admin.html">Back to dashboard</a>';
  } else if (user) {
    box.innerHTML = '<button class="btn btn-primary" type="button" disabled><i class="bi bi-stars me-1"></i>See my best matches</button>';
  } else {
    box.innerHTML =
      '<a class="btn btn-primary" href="register.html">Create an account</a>' +
      '<a class="btn btn-soft" href="login.html">Log in</a>';
  }
}

// Draw a curved line from each member card to the ProjectHub card
function drawTeamLines() {
  const stage = document.getElementById("teamStage");
  const svg = document.getElementById("teamLines");
  const hub = document.getElementById("hubCard");
  const lines = svg.querySelectorAll(".team-line");

  const stageBox = stage.getBoundingClientRect();
  const hubBox = hub.getBoundingClientRect();
  svg.setAttribute("viewBox", "0 0 " + stageBox.width + " " + stageBox.height);

  lines.forEach(function (line, index) {
    const cardBox = document.getElementById("member" + index).getBoundingClientRect();
    let start;
    let end;

    if (cardBox.right <= hubBox.left) {
      // Card on the left: from its right edge to the left of ProjectHub
      start = [cardBox.right, cardBox.top + cardBox.height / 2];
      end = [hubBox.left, hubBox.top + hubBox.height / 2];
    } else if (cardBox.left >= hubBox.right) {
      // Card on the right
      start = [cardBox.left, cardBox.top + cardBox.height / 2];
      end = [hubBox.right, hubBox.top + hubBox.height / 2];
    } else if (cardBox.bottom <= hubBox.top) {
      // Mobile: card above ProjectHub
      start = [cardBox.left + cardBox.width / 2, cardBox.bottom];
      end = [hubBox.left + hubBox.width / 2, hubBox.top];
    } else {
      // Mobile: card below ProjectHub
      start = [cardBox.left + cardBox.width / 2, cardBox.top];
      end = [hubBox.left + hubBox.width / 2, hubBox.bottom];
    }

    // Positions inside the picture
    const x1 = start[0] - stageBox.left;
    const y1 = start[1] - stageBox.top;
    const x2 = end[0] - stageBox.left;
    const y2 = end[1] - stageBox.top;
    const middleX = (x1 + x2) / 2;

    line.setAttribute("d", "M" + x1 + " " + y1 + " C " + middleX + " " + y1 + ", " + middleX + " " + y2 + ", " + x2 + " " + y2);
    const length = line.getTotalLength();
    line.style.strokeDasharray = length;

    // Hide the line until the team is connected
    const isHidden = stage.classList.contains("waiting") && !document.getElementById("member" + index).classList.contains("joined");
    line.style.strokeDashoffset = isHidden ? length : 0;
  });
}

// Connect the members one by one and fill the counter
function connectTeam() {
  const stage = document.getElementById("teamStage");
  const lines = document.querySelectorAll(".team-line");
  const count = document.getElementById("hubCount");
  const fill = document.getElementById("hubFill");

  count.textContent = "0";
  fill.style.width = "0%";

  lines.forEach(function (line, index) {
    setTimeout(function () {
      line.style.strokeDashoffset = 0;
      document.getElementById("member" + index).classList.add("joined");
      count.textContent = index + 1;
      fill.style.width = ((index + 1) / lines.length) * 100 + "%";
      if (index === lines.length - 1) {
        stage.classList.add("connected");
      }
    }, 400 + index * 450);
  });
}

// Count a number up from 0 (for example 0% to 93.9%)
function countUp(element) {
  if (!element) {
    return;
  }
  const target = parseFloat(element.dataset.count);
  const start = performance.now();
  const duration = 1200;

  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    element.textContent = (target * progress).toFixed(1) + "%";
    if (progress < 1) {
      requestAnimationFrame(step);
    }
  }
  requestAnimationFrame(step);
}
