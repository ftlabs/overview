function init() {
  var inputs = document.querySelectorAll(".input");
  var paras = Array.from(
    document.querySelector(".description-flex-container").children
  );

  inputs.forEach(function(element, index) {
    element.addEventListener("click", function(e) {
      var caller = e.target || e.srcElement;

      toggleActiveElements(inputs, caller);

      toggleActiveElements(paras, paras[index]);
    });
  });
}

function toggleActiveElements(elements, selectedElement) {
  elements.forEach(element => {
    if (element.classList.contains("active")) {
      element.classList.remove("active");
    }
  });

  selectedElement.classList.add("active");
}

document.addEventListener("DOMContentLoaded", init, false);
