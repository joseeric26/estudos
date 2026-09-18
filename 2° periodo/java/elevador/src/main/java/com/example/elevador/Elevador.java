package com.example.elevador;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Elevador {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private int andarAtual = 0;

    private double pesoMaximo;

    private double pesoAtual = 0;

    public void adicionarPeso(double peso) {
        this.pesoAtual += peso;
    }

    public void removerPeso(double peso) {
        if (peso <= this.pesoAtual) {
            this.pesoAtual -= peso;
        }
    }

    public String subir() {
        if (pesoAtual > pesoMaximo) {
            return "Excesso de peso! Elevador não pode subir.";
        } else {
            andarAtual++;
            return "Elevador subiu para o andar: " + andarAtual;
        }
    }
}
