{{- define "time-tracker.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "time-tracker.fullname" -}}
{{- default (include "time-tracker.name" .) .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "time-tracker.labels" -}}
app.kubernetes.io/name: {{ include "time-tracker.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version | quote }}
{{- end }}

{{- define "time-tracker.selectorLabels" -}}
app.kubernetes.io/name: {{ include "time-tracker.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
