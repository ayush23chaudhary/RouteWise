from dataclasses import dataclass, field


@dataclass(frozen=True)
class ValidationResult:
    """
    Immutable value object encapsulating schedule validation outputs.
    """
    is_compliant: bool
    violations: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
