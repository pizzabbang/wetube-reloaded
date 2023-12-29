const videoContainer = document.getElementById("videoContainer");
const form = document.getElementById("commentForm");
const deleteBtns = document.querySelectorAll(".comment__delete");

const addComment = (text, commentId, videoId) => {
  const videoComments = document.querySelector(".video__comments ul");
  const newComment = document.createElement("li");
  newComment.className = "video__comment";

  const span = document.createElement("span");
  const span2 = document.createElement("span");
  span2.className = "comment__delete";
  span2.innerText = "✖️";
  span2.dataset.id = commentId;
  span2.dataset.videoId = videoId;

  const icon = document.createElement("i");
  icon.className = "fas fa-comment";
  const childSpan = document.createElement("span");
  span.innerText = ` ${text}`;
  span.prepend(icon);
  span.appendChild(childSpan);

  newComment.appendChild(span);
  newComment.appendChild(span2);
  videoComments.prepend(newComment);

  span2.addEventListener("click", deleteComment);
};

const handleSubmit = async (event) => {
  event.preventDefault();
  const textarea = form.querySelector("textarea");
  const text = textarea.value;
  const videoId = videoContainer.dataset.id;
  if (text === "") {
    return;
  }
  const response = await fetch(`/api/videos/${videoId}/comment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json", //string이 아닌 json을 보내는 것이라 알려줘야 한다
    },
    body: JSON.stringify({ text }), //object를 json 문자열로 바꿔준다
  });
  if (response.status === 201) {
    textarea.value = "";
    const { newCommentId } = await response.json();
    addComment(text, newCommentId, videoId);
  }
};

if (form) {
  form.addEventListener("submit", handleSubmit);
}

const deleteCommentHtml = (comment) => {
  const li = comment.parentNode;
  const ul = li.parentNode;
  ul.removeChild(li);
};

const deleteComment = async (event) => {
  const commentId = event.target.dataset.id;
  const videoId = event.target.dataset.videoid;
  const response = await fetch(`/api/comments/${commentId}/delete`, {
    method: "DELETE",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ videoId }),
  });
  if (response.status === 201) {
    deleteCommentHtml(event.target);
  }
};

deleteBtns.forEach(function (deleteBtn) {
  deleteBtn.addEventListener("click", deleteComment);
});
