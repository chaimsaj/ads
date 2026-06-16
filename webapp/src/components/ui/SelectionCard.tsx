import type { HTMLAttributes, ReactNode } from 'react';
import styles from './SelectionCard.module.css';

interface SelectionCardProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  description: string;
  icon?: ReactNode;
  image?: string;
  selected?: boolean;
  onSelect?: () => void;
}

export function SelectionCard({
  title,
  description,
  icon,
  image,
  selected = false,
  onSelect,
  className = '',
  ...props
}: SelectionCardProps) {
  const classNames = [
    styles.card,
    selected ? styles.selected : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classNames}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect?.();
        }
      }}
      {...props}
    >
      <div className={styles.radioContainer}>
        <div className={`${styles.radio} ${selected ? styles.radioSelected : ''}`}>
          {selected && <div className={styles.radioDot} />}
        </div>
      </div>
      <div className={styles.content}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description}>{description}</p>
        {icon && <div className={styles.icon}>{icon}</div>}
        {image && (
          <div className={styles.imageContainer}>
            <img src={image} alt={title} className={styles.image} />
          </div>
        )}
      </div>
    </div>
  );
}
