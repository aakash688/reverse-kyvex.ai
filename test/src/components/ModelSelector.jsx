import './ModelSelector.css';

export default function ModelSelector({ models, selectedModel, onSelectModel, loading }) {
  if (loading) {
    return (
      <div className="model-selector">
        <div className="loading">Loading models...</div>
      </div>
    );
  }

  return (
    <div className="model-selector">
      <label htmlFor="model-select">Model:</label>
      <select
        id="model-select"
        value={selectedModel}
        onChange={(e) => onSelectModel(e.target.value)}
        className="model-select"
      >
        {models.map(model => (
          <option key={model.id} value={model.id}>
            {model.name || model.id}
          </option>
        ))}
      </select>
    </div>
  );
}

