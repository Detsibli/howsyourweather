fetch("/README.md")
  .then((response) => response.text())
  .then((data) => {
    document.getElementById("readmeContent").textContent = data;
  })
  .catch((err) => {
    document.getElementById("readmeContent").textContent =
      "Could not load README file.";
    console.error(err);
  });
