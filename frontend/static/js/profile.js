// Suggests a starting category from a typed skill name — always editable
// via the dropdown before adding, since the person adding their own skill
// is the one who actually knows what it is.
const CATEGORY_KEYWORDS = {
  Technology: ['coding', 'code', 'programming', 'python', 'javascript', 'java', 'c++', 'web', 'html', 'css',
    'software', 'app', 'machine learning', 'artificial intelligence', ' ai', 'data', 'database', 'sql',
    'cyber', 'network', 'excel', 'computer', 'robotics', 'tech'],
  Art: ['draw', 'sketch', 'paint', 'photo', 'edit', 'design', 'art', 'danc', 'illustrat', 'animat',
    'graphic', 'film', 'video edit', 'calligraphy', 'sculpt'],
  Music: ['guitar', 'music', 'piano', 'sing', 'drum', 'violin', 'band', 'dj', 'ukulele', 'saxophone',
    'flute', 'cello', 'songwrit', 'compos'],
  Languages: ['french', 'spanish', 'german', 'language', 'english', 'italian', 'mandarin', 'japanese',
    'chinese', 'korean', 'arabic', 'portuguese', 'russian', 'hindi', 'sign language'],
  Sports: ['football', 'basketball', 'soccer', 'tennis', 'swim', 'cricket', 'running', 'gym', 'badminton',
    'volleyball', 'boxing', 'martial arts', 'cycling', 'hiking', 'athletics', 'skating', 'golf'],
  Academics: ['math', 'physics', 'chemistry', 'biology', 'science', 'history', 'geography', 'economics',
    'statistics', 'calculus', 'literature', 'philosophy', 'tutor', 'exam prep'],
  Cooking: ['cook', 'baking', 'bake', 'recipe', 'cuisine', 'chef', 'grill', 'pastry', 'bartend', 'mixology'],
  Business: ['business', 'marketing', 'accounting', 'finance', 'invest', 'entrepreneur', 'sales',
    'management', 'resume', 'interview prep', 'seo', 'copywriting', 'negotiat'],
  Wellness: ['yoga', 'fitness', 'meditat', 'mindful', 'therapy', 'nutrition', 'wellness', 'self-care',
    'mental health', 'stress'],
  Crafts: ['knit', 'crochet', 'sewing', 'woodwork', 'pottery', 'garden', 'diy', 'craft', 'jewelry', 'origami'],
  Writing: ['writing', 'write', 'journal', 'blog', 'poetry', 'essay', 'grammar', 'storytell',
    'public speaking', 'copyediting'],
  Games: ['chess', 'checkers', 'board game', 'video game', 'puzzle', 'poker', 'card game', 'esports', 'gaming'],
};

function suggestCategory(skillName) {
  const lower = skillName.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) return category;
  }
  return 'Other';
}

let teachSkills = [];
let learnSkills = [];

function renderChips(listId, skills, onRemove) {
  const container = document.getElementById(listId);
  if (skills.length === 0) {
    container.innerHTML = '<span class="muted">Nothing added yet</span>';
    return;
  }
  container.innerHTML = skills.map((s, i) => `
    <span class="skill-chip">${s.name} <span class="skill-chip-category">${s.category}</span>
      <button type="button" data-index="${i}" aria-label="Remove ${s.name}">×</button>
    </span>
  `).join('');
  container.querySelectorAll('button[data-index]').forEach((btn) => {
    btn.addEventListener('click', () => onRemove(Number(btn.dataset.index)));
  });
}

function setupSkillAdder(nameInputId, categorySelectId, skillsArrayGetter, skillsArraySetter, chipListId) {
  const nameInput = document.getElementById(nameInputId);

  nameInput.addEventListener('input', () => {
    if (!nameInput.value.trim()) return;
    document.getElementById(categorySelectId).value = suggestCategory(nameInput.value);
    refreshCustomSelect(categorySelectId);
  });

  function render() {
    renderChips(chipListId, skillsArrayGetter(), (index) => {
      const updated = skillsArrayGetter().slice();
      updated.splice(index, 1);
      skillsArraySetter(updated);
      render();
    });
  }

  document.getElementById(nameInputId.replace('NameInput', 'AddBtn')).addEventListener('click', () => {
    const name = nameInput.value.trim();
    if (!name) return;
    const category = document.getElementById(categorySelectId).value || 'Other';
    skillsArraySetter([...skillsArrayGetter(), { name, category }]);
    nameInput.value = '';
    render();
  });

  return render;
}

const renderTeachChips = setupSkillAdder(
  'teachNameInput', 'teachCategorySelect', () => teachSkills, (v) => { teachSkills = v; }, 'teachChipList'
);
const renderLearnChips = setupSkillAdder(
  'learnNameInput', 'learnCategorySelect', () => learnSkills, (v) => { learnSkills = v; }, 'learnChipList'
);

async function loadMyProfile() {
  try {
    const user = await api('/api/profile');
    document.getElementById('bio').value = user.bio || '';
    document.getElementById('experience_level').value = user.experience_level || '';
    document.getElementById('availability').value = user.availability || '';
    document.getElementById('learning_preference').value = user.learning_preference || '';
    refreshCustomSelect('experience_level');
    refreshCustomSelect('availability');
    refreshCustomSelect('learning_preference');
    document.getElementById('interests').value = user.interests || '';

    teachSkills = user.teach;
    learnSkills = user.learn;
    renderTeachChips();
    renderLearnChips();

    if (user.avatar_url) {
      document.getElementById('avatarPreview').src = user.avatar_url;
    }
  } catch (e) {
    showToast(e.message);
  }
}

document.getElementById('profileForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    bio: document.getElementById('bio').value.trim(),
    experience_level: document.getElementById('experience_level').value,
    availability: document.getElementById('availability').value,
    learning_preference: document.getElementById('learning_preference').value,
    interests: document.getElementById('interests').value.trim(),
    teach: teachSkills,
    learn: learnSkills,
  };

  try {
    await api('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    showToast('Profile saved! 🎉');
  } catch (err) {
    showToast(err.message);
  }
});

document.getElementById('changePhotoBtn').addEventListener('click', () => {
  document.getElementById('photoInput').click();
});

document.getElementById('photoInput').addEventListener('change', async () => {
  const file = document.getElementById('photoInput').files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('photo', file);

  try {
    const res = await api('/api/profile/photo', { method: 'POST', body: formData });
    document.getElementById('avatarPreview').src = res.avatar_url;
    showToast('Photo updated! 📷');
  } catch (err) {
    showToast(err.message);
  }
});

loadMyProfile();
